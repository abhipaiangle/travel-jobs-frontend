import { useCallback, useEffect, useRef, useState } from "react";

const MAX_SECONDS = 60;
const MIN_SECONDS = 10;

/** Returns { state, elapsed, blob, blobUrl, start, stop, reset, MAX_SECONDS, MIN_SECONDS } */
export function useVoiceRecorder() {
  const [state, setState] = useState("idle"); // idle | recording | stopped | error
  const [elapsed, setElapsed] = useState(0);
  const [blob, setBlob] = useState(null);
  const [blobUrl, setBlobUrl] = useState(null);
  const [error, setError] = useState(null);

  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerRef = useRef(null);

  const cleanup = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    recorderRef.current = null;
  };

  const stop = useCallback(() => {
    const r = recorderRef.current;
    if (r && r.state !== "inactive") {
      r.stop();
    }
  }, []);

  const start = useCallback(async () => {
    setError(null);
    setBlob(null);
    if (blobUrl) URL.revokeObjectURL(blobUrl);
    setBlobUrl(null);
    setElapsed(0);
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const rec = new MediaRecorder(stream, { mimeType: mime });
      recorderRef.current = rec;

      rec.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = () => {
        const finalBlob = new Blob(chunksRef.current, { type: mime });
        setBlob(finalBlob);
        setBlobUrl(URL.createObjectURL(finalBlob));
        setState("stopped");
        cleanup();
      };
      rec.start();
      setState("recording");

      const startedAt = Date.now();
      timerRef.current = setInterval(() => {
        const secs = Math.floor((Date.now() - startedAt) / 1000);
        setElapsed(secs);
        if (secs >= MAX_SECONDS) stop();
      }, 200);
    } catch (e) {
      setError(e.message || "Microphone access denied");
      setState("error");
      cleanup();
    }
  }, [blobUrl, stop]);

  const reset = useCallback(() => {
    if (blobUrl) URL.revokeObjectURL(blobUrl);
    setBlob(null);
    setBlobUrl(null);
    setElapsed(0);
    setError(null);
    setState("idle");
  }, [blobUrl]);

  useEffect(() => () => {
    cleanup();
    if (blobUrl) URL.revokeObjectURL(blobUrl);
  }, [blobUrl]);

  return { state, elapsed, blob, blobUrl, error, start, stop, reset, MAX_SECONDS, MIN_SECONDS };
}
