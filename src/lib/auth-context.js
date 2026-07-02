import { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithCustomToken,
  signInWithPhoneNumber,
  signInWithPopup,
  signOut as fbSignOut,
} from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase";
import { api } from "@/lib/api";

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

async function exchange(idToken, role, emailVerificationToken) {
  return api.post("/api/auth/session", {
    id_token: idToken,
    role,
    email_verification_token: emailVerificationToken || null,
  });
}

async function fetchMe() {
  try {
    const r = await api.get("/api/auth/me");
    return r.data;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const me = await fetchMe();
    setUser(me);
    return me;
  }, []);

  useEffect(() => {
    (async () => {
      await refreshUser();
      setLoading(false);
    })();
    const unsub = onAuthStateChanged(firebaseAuth, () => {});
    return () => unsub();
  }, [refreshUser]);

  const emailOtpAuth = async ({ customToken, verificationToken, role, expectedRole }) => {
    // Single passwordless entrypoint: the server minted a custom Firebase
    // token after we verified the OTP; we sign in with it, then exchange the
    // resulting ID token for our session cookie.
    const cred = await signInWithCustomToken(firebaseAuth, customToken);
    const idToken = await cred.user.getIdToken();
    const res = await exchange(idToken, role, verificationToken);
    if (expectedRole && res.data?.role && res.data.role !== expectedRole) {
      await api.post("/api/auth/logout");
      await fbSignOut(firebaseAuth);
      const err = new Error(
        `This email is registered as a ${res.data.role}. Please use the ${res.data.role} sign-in.`
      );
      err.code = "wrong-role";
      err.actualRole = res.data.role;
      throw err;
    }
    return await refreshUser();
  };

  const loginGoogle = async ({ role, expectedRole } = {}) => {
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(firebaseAuth, provider);
    const idToken = await cred.user.getIdToken();
    const res = await exchange(idToken, role, null);
    if (expectedRole && res.data?.role && res.data.role !== expectedRole) {
      await api.post("/api/auth/logout");
      await fbSignOut(firebaseAuth);
      const err = new Error(
        `This Google account is registered as a ${res.data.role}. Use the ${res.data.role} sign-in.`
      );
      err.code = "wrong-role";
      err.actualRole = res.data.role;
      throw err;
    }
    return await refreshUser();
  };

  const sendPhoneOtp = async ({ phone, recaptcha }) => {
    return await signInWithPhoneNumber(firebaseAuth, phone, recaptcha);
  };

  const verifyPhoneOtp = async ({ confirmationResult, code, role, expectedRole }) => {
    const cred = await confirmationResult.confirm(code);
    const idToken = await cred.user.getIdToken();
    const res = await exchange(idToken, role, null);
    if (expectedRole && res.data?.role && res.data.role !== expectedRole) {
      await api.post("/api/auth/logout");
      await fbSignOut(firebaseAuth);
      const err = new Error(
        `This phone number is registered as a ${res.data.role}. Use the ${res.data.role} sign-in.`
      );
      err.code = "wrong-role";
      err.actualRole = res.data.role;
      throw err;
    }
    return await refreshUser();
  };

  const logout = async () => {
    try { await api.post("/api/auth/logout"); } catch {}
    try { await fbSignOut(firebaseAuth); } catch {}
    setUser(null);
  };

  return (
    <AuthCtx.Provider value={{ loading, user, emailOtpAuth, loginGoogle, sendPhoneOtp, verifyPhoneOtp, logout, refreshUser }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useRequireRole(role, redirectTo) {
  const auth = useAuth();
  const needsRedirect = !auth.loading && (!auth.user || auth.user.role !== role);
  return { ...auth, needsRedirect, redirectTo };
}
