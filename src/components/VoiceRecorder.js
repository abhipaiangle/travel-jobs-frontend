import { Mic, Square, RotateCcw, CheckCircle2, AlertCircle } from "lucide-react";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import { Button } from "@/components/ui/button";
import { VOICE_SCRIPT_LINES } from "@/constants/roles";

function fmt(secs) {
  const m = Math.floor(secs / 60);
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function VoiceRecorder({ onReady, existingUrl, uploading }) {
  const rec = useVoiceRecorder();
  const ready = rec.state === "stopped" && rec.blob && rec.elapsed >= rec.MIN_SECONDS;
  const tooShort = rec.state === "stopped" && rec.elapsed < rec.MIN_SECONDS;
  const progress = Math.min(100, (rec.elapsed / rec.MAX_SECONDS) * 100);

  const handleUse = () => ready && onReady?.(rec.blob, rec.elapsed);

  return (
    <div className="tj-card p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-base font-semibold text-slate-900">Voice introduction</h3>
          <p className="text-sm text-slate-600 mt-0.5">
            A short voice intro helps employers hear you before they call. Required — but you can re-record as many times as you like.
          </p>
        </div>
        {existingUrl && rec.state === "idle" && (
          <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full">
            <CheckCircle2 className="h-3 w-3" /> On file
          </span>
        )}
      </div>

      <div className="mt-5 rounded-xl bg-slate-50 border border-slate-200 p-4 text-sm">
        <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Suggested script</div>
        <ul className="mt-2 space-y-1 text-slate-700">
          {VOICE_SCRIPT_LINES.map((l) => (
            <li key={l} className="flex gap-2"><span className="text-slate-400">·</span>{l}</li>
          ))}
        </ul>
      </div>

      <div className="mt-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
          <div className="font-mono text-2xl sm:text-3xl tabular-nums font-medium text-slate-900">
            {fmt(rec.elapsed)}
            <span className="text-sm sm:text-base text-slate-400 font-sans"> / {fmt(rec.MAX_SECONDS)}</span>
          </div>
          <div className="flex items-center gap-2">
            {rec.state !== "recording" ? (
              <Button onClick={rec.start} type="button" size="lg" className="flex-1 sm:flex-none">
                <Mic className="h-4 w-4" />
                {rec.blob ? "Re-record" : "Start recording"}
              </Button>
            ) : (
              <Button onClick={rec.stop} type="button" size="lg" variant="destructive" className="flex-1 sm:flex-none">
                <Square className="h-4 w-4" /> Stop
              </Button>
            )}
            {rec.blob && rec.state === "stopped" && (
              <Button onClick={rec.reset} type="button" variant="ghost" size="icon" aria-label="Reset">
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
          <div
            className={`h-full transition-all ${rec.state === "recording" ? "bg-rose-500" : "bg-slate-400"}`}
            style={{ width: `${progress}%` }}
          />
        </div>

        {rec.blobUrl && (
          <audio controls src={rec.blobUrl} className="w-full mt-4" />
        )}

        {tooShort && (
          <div className="mt-3 flex items-start gap-2 text-xs text-amber-700">
            <AlertCircle className="h-4 w-4 mt-0.5" />
            A bit short — try at least {rec.MIN_SECONDS}s so employers get a real sense of you.
          </div>
        )}
        {rec.error && (
          <div className="mt-3 flex items-start gap-2 text-xs text-rose-700">
            <AlertCircle className="h-4 w-4 mt-0.5" />
            Microphone error: {rec.error}
          </div>
        )}

        <div className="mt-5 flex items-center justify-end gap-2">
          <Button
            disabled={!ready || uploading}
            onClick={handleUse}
            type="button"
            className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto h-11"
          >
            {uploading ? "Saving…" : "Use this recording"}
          </Button>
        </div>
      </div>
    </div>
  );
}
