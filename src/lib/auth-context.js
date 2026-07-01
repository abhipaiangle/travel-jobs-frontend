import { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as fbSignOut,
} from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase";
import { api } from "@/lib/api";

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

async function exchange(idToken, role) {
  return api.post("/api/auth/session", { id_token: idToken, role });
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

  const signupEmail = async ({ email, password, role }) => {
    const cred = await createUserWithEmailAndPassword(firebaseAuth, email, password);
    const idToken = await cred.user.getIdToken();
    await exchange(idToken, role);
    return await refreshUser();
  };

  const loginEmail = async ({ email, password, expectedRole }) => {
    const cred = await signInWithEmailAndPassword(firebaseAuth, email, password);
    const idToken = await cred.user.getIdToken();
    const res = await exchange(idToken, null);
    if (expectedRole && res.data?.role && res.data.role !== expectedRole) {
      await api.post("/api/auth/logout");
      await fbSignOut(firebaseAuth);
      const err = new Error(
        `This account is registered as a ${res.data.role}. Please use the ${res.data.role} sign-in.`
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
    const res = await exchange(idToken, role);
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

  const logout = async () => {
    try { await api.post("/api/auth/logout"); } catch {}
    try { await fbSignOut(firebaseAuth); } catch {}
    setUser(null);
  };

  return (
    <AuthCtx.Provider value={{ loading, user, signupEmail, loginEmail, loginGoogle, logout, refreshUser }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useRequireRole(role, redirectTo) {
  const auth = useAuth();
  const needsRedirect = !auth.loading && (!auth.user || auth.user.role !== role);
  return { ...auth, needsRedirect, redirectTo };
}
