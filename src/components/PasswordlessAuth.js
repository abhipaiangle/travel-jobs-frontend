import { useEffect, useRef, useState } from "react";
import { RecaptchaVerifier } from "firebase/auth";
import { ArrowLeft, Mail, Phone } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { firebaseAuth } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const RECAPTCHA_ID = "passwordless-recaptcha";

/**
 * Unified passwordless auth entrypoint. Renders three "Continue with…" buttons
 * (Google / Phone / Email) and drives the OTP flows in-place. Signup and
 * sign-in are the same flow — the backend upserts on first sign-in.
 *
 * Props:
 *   role: "candidate" | "employer" — used only for first-time account creation
 *   expectedRole: "candidate" | "employer" | "admin" — used to reject cross-role sign-ins
 *   methods: ["google", "phone", "email"] — controls which buttons render (in order)
 *   onSuccess: (opts) => void — fires after the session cookie is set
 *   consent?: ReactNode — optional consent block rendered above the buttons; if provided,
 *                        it must be accepted before any method is used (the parent handles the state)
 *   requireConsent?: boolean — if true, refuse to proceed until `consentAccepted` is true
 *   consentAccepted?: boolean
 */
export default function PasswordlessAuth({
  role = "candidate",
  expectedRole = "candidate",
  methods = ["google", "phone", "email"],
  onSuccess,
  consent,
  requireConsent,
  consentAccepted,
}) {
  const { loginGoogle, sendPhoneOtp, verifyPhoneOtp, emailOtpAuth } = useAuth();
  const [view, setView] = useState("chooser"); // chooser | phone | phone-otp | email | email-otp
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);

  const [phone, setPhone] = useState("");
  const [phoneConfirmation, setPhoneConfirmation] = useState(null);
  const [phoneCode, setPhoneCode] = useState("");
  const recaptchaRef = useRef(null);

  const [email, setEmail] = useState("");
  const [emailCode, setEmailCode] = useState("");

  useEffect(() => {
    return () => {
      if (recaptchaRef.current) {
        try { recaptchaRef.current.clear(); } catch {}
        recaptchaRef.current = null;
      }
    };
  }, []);

  const consentBlocked = () => {
    if (requireConsent && !consentAccepted) {
      toast.error("Please accept the terms to continue.");
      return true;
    }
    return false;
  };

  // -------- Google --------
  const doGoogle = async () => {
    if (consentBlocked()) return;
    setBusy(true);
    try {
      await loginGoogle({ role, expectedRole });
      onSuccess?.({ method: "google" });
    } catch (err) {
      if (err?.code === "wrong-role") toast.error(err.message);
      else toast.error(err?.message || "Google sign-in failed");
    } finally {
      setBusy(false);
    }
  };

  // -------- Phone --------
  const ensureRecaptcha = async () => {
    if (recaptchaRef.current) return recaptchaRef.current;
    const container = document.getElementById(RECAPTCHA_ID);
    if (container) container.innerHTML = "";
    const verifier = new RecaptchaVerifier(firebaseAuth, RECAPTCHA_ID, { size: "invisible" });
    await verifier.render();
    recaptchaRef.current = verifier;
    return verifier;
  };
  const resetRecaptcha = () => {
    if (recaptchaRef.current) {
      try { recaptchaRef.current.clear(); } catch {}
      recaptchaRef.current = null;
    }
    const container = document.getElementById(RECAPTCHA_ID);
    if (container) container.innerHTML = "";
  };

  const fullPhone = phone.startsWith("+") ? phone : `+91${phone.replace(/\D/g, "")}`;
  const phoneValid = /^\+\d{10,15}$/.test(fullPhone);

  const doSendPhone = async () => {
    if (consentBlocked()) return;
    if (!phoneValid) { toast.error("Enter a valid phone number"); return; }
    setBusy(true);
    try {
      const verifier = await ensureRecaptcha();
      const result = await sendPhoneOtp({ phone: fullPhone, recaptcha: verifier });
      setPhoneConfirmation(result);
      setPhoneCode("");
      setView("phone-otp");
      toast.success(`Code sent to ${fullPhone}`);
    } catch (err) {
      resetRecaptcha();
      toast.error(err?.message || "Could not send code");
    } finally {
      setBusy(false);
    }
  };

  const doResendPhone = async () => {
    resetRecaptcha();
    setResending(true);
    try {
      const verifier = await ensureRecaptcha();
      const result = await sendPhoneOtp({ phone: fullPhone, recaptcha: verifier });
      setPhoneConfirmation(result);
      toast.success("New code sent");
    } catch (err) {
      resetRecaptcha();
      toast.error(err?.message || "Could not resend");
    } finally {
      setResending(false);
    }
  };

  const doVerifyPhone = async () => {
    if (phoneCode.length !== 6) { toast.error("Enter the 6-digit code"); return; }
    if (!phoneConfirmation) { toast.error("Send the code first"); return; }
    setBusy(true);
    try {
      await verifyPhoneOtp({ confirmationResult: phoneConfirmation, code: phoneCode, role, expectedRole });
      onSuccess?.({ method: "phone" });
    } catch (err) {
      if (err?.code === "wrong-role") toast.error(err.message);
      else toast.error(err?.message || "Verification failed");
    } finally {
      setBusy(false);
    }
  };

  // -------- Email --------
  const doSendEmail = async () => {
    if (consentBlocked()) return;
    if (!email || !email.includes("@")) { toast.error("Enter a valid email"); return; }
    setBusy(true);
    try {
      await api.post("/api/auth/email-otp/send", { email });
      toast.success(`We've emailed a code to ${email}`);
      setEmailCode("");
      setView("email-otp");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Could not send code");
    } finally {
      setBusy(false);
    }
  };

  const doResendEmail = async () => {
    setResending(true);
    try {
      await api.post("/api/auth/email-otp/send", { email });
      toast.success("New code sent");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Could not resend");
    } finally {
      setResending(false);
    }
  };

  const doVerifyEmail = async () => {
    if (emailCode.length !== 6) { toast.error("Enter the 6-digit code"); return; }
    setBusy(true);
    try {
      const r = await api.post("/api/auth/email-otp/verify", { email, code: emailCode });
      const { verification_token, custom_token } = r.data || {};
      if (!custom_token) throw new Error("Verification failed");
      await emailOtpAuth({
        customToken: custom_token,
        verificationToken: verification_token,
        role,
        expectedRole,
      });
      onSuccess?.({ method: "email" });
    } catch (err) {
      if (err?.code === "wrong-role") toast.error(err.message);
      else toast.error(err?.response?.data?.detail || err?.message || "Verification failed");
    } finally {
      setBusy(false);
    }
  };

  // -------- Render --------
  // The reCAPTCHA container MUST stay mounted across view swaps — Firebase
  // holds a reference to this DOM node and will throw "Cannot read properties
  // of null (reading 'style')" if it disappears mid-challenge.
  return (
    <>
      {view === "chooser" && (
        <div className="space-y-3">
          {consent}
          {methods.includes("google") && (
            <Button
              type="button"
              variant="outline"
              className="w-full h-12 justify-center gap-2.5"
              onClick={doGoogle}
              disabled={busy}
            >
              <GoogleG /> Continue with Google
            </Button>
          )}
          {methods.includes("phone") && (
            <Button
              type="button"
              variant="outline"
              className="w-full h-12 justify-center gap-2.5"
              onClick={() => { if (!consentBlocked()) setView("phone"); }}
              disabled={busy}
            >
              <Phone className="h-4 w-4" /> Continue with Phone number
            </Button>
          )}
          {methods.includes("email") && (
            <Button
              type="button"
              variant="outline"
              className="w-full h-12 justify-center gap-2.5"
              onClick={() => { if (!consentBlocked()) setView("email"); }}
              disabled={busy}
            >
              <Mail className="h-4 w-4" /> Continue with Email
            </Button>
          )}
        </div>
      )}

      {view === "phone" && (
        <div className="space-y-4">
          <BackButton onClick={() => { resetRecaptcha(); setView("chooser"); }} />
          <div className="space-y-1.5">
            <Label htmlFor="pl-phone">Phone number</Label>
            <div className="flex items-stretch gap-2">
              <div className="h-11 px-3 rounded-md border border-slate-200 bg-slate-50 grid place-items-center text-sm text-slate-600 shrink-0">
                +91
              </div>
              <Input
                id="pl-phone" type="tel" inputMode="numeric" autoComplete="tel-national"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="10-digit mobile number"
                className="flex-1 h-11"
                autoFocus
              />
            </div>
            <p className="text-xs text-slate-500">We'll send a 6-digit code via SMS.</p>
          </div>
          <Button
            type="button"
            onClick={doSendPhone}
            disabled={busy || !phoneValid}
            className="w-full h-11 bg-slate-900 hover:bg-slate-800"
          >
            {busy ? "Sending code…" : "Send code"}
          </Button>
        </div>
      )}

      {view === "phone-otp" && (
        <div className="space-y-4">
          <BackButton onClick={() => { resetRecaptcha(); setView("phone"); }} label="Change number" />
          <div className="space-y-1.5">
            <Label htmlFor="pl-phone-code">Verification code</Label>
            <p className="text-xs text-slate-500">Sent to {fullPhone}</p>
            <Input
              id="pl-phone-code" inputMode="numeric" autoComplete="one-time-code" maxLength={6}
              value={phoneCode}
              onChange={(e) => setPhoneCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="123456"
              className="text-center text-lg tracking-[0.6em] font-mono h-11"
              autoFocus
            />
          </div>
          <Button
            type="button"
            onClick={doVerifyPhone}
            disabled={busy || phoneCode.length !== 6}
            className="w-full h-11 bg-slate-900 hover:bg-slate-800"
          >
            {busy ? "Verifying…" : "Verify & continue"}
          </Button>
          <div className="text-center">
            <button
              type="button"
              onClick={doResendPhone}
              disabled={resending}
              className="text-sm text-blue-600 hover:underline disabled:text-slate-400"
            >
              {resending ? "Sending…" : "Resend code"}
            </button>
          </div>
        </div>
      )}

      {view === "email" && (
        <div className="space-y-4">
          <BackButton onClick={() => setView("chooser")} />
          <div className="space-y-1.5">
            <Label htmlFor="pl-email">Email</Label>
            <Input
              id="pl-email" type="email" autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="h-11"
              autoFocus
            />
            <p className="text-xs text-slate-500">We'll send a 6-digit code to this email.</p>
          </div>
          <Button
            type="button"
            onClick={doSendEmail}
            disabled={busy || !email}
            className="w-full h-11 bg-slate-900 hover:bg-slate-800"
          >
            {busy ? "Sending code…" : "Send code"}
          </Button>
        </div>
      )}

      {view === "email-otp" && (
        <div className="space-y-4">
          <BackButton onClick={() => setView("email")} label="Change email" />
          <div className="space-y-1.5">
            <Label htmlFor="pl-email-code">Verification code</Label>
            <p className="text-xs text-slate-500">Sent to {email}</p>
            <Input
              id="pl-email-code" inputMode="numeric" autoComplete="one-time-code" maxLength={6}
              value={emailCode}
              onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="123456"
              className="text-center text-lg tracking-[0.6em] font-mono h-11"
              autoFocus
            />
          </div>
          <Button
            type="button"
            onClick={doVerifyEmail}
            disabled={busy || emailCode.length !== 6}
            className="w-full h-11 bg-slate-900 hover:bg-slate-800"
          >
            {busy ? "Verifying…" : "Verify & continue"}
          </Button>
          <div className="text-center">
            <button
              type="button"
              onClick={doResendEmail}
              disabled={resending}
              className="text-sm text-blue-600 hover:underline disabled:text-slate-400"
            >
              {resending ? "Sending…" : "Resend code"}
            </button>
          </div>
        </div>
      )}

      <div id={RECAPTCHA_ID} />
    </>
  );
}

function BackButton({ onClick, label = "Back" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-slate-500 hover:text-slate-900 inline-flex items-center gap-1 text-sm"
    >
      <ArrowLeft className="h-3.5 w-3.5" /> {label}
    </button>
  );
}

function GoogleG() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4">
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.4-1.65 4.1-5.5 4.1-3.32 0-6.02-2.75-6.02-6.15S8.68 5.9 12 5.9c1.88 0 3.14.8 3.86 1.5l2.62-2.5C16.9 3.4 14.65 2.5 12 2.5 6.9 2.5 2.75 6.65 2.75 11.75S6.9 21 12 21c6.92 0 9.35-4.87 9.35-7.35 0-.5-.05-.88-.12-1.45H12z"/>
    </svg>
  );
}
