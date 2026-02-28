import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { api } from "@/lib/api-bridge";
import { api as supabase } from "@/lib/api-bridge";
import { lovable } from "@/integrations/lovable/index";

interface Profile {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, firstName?: string, lastName?: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signInWithPhone: (phone: string) => Promise<{ error: Error | null }>;
  verifyOTP: (phone: string, token: string) => Promise<{ error: Error | null }>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await api.from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (!error && data) {
      setProfile(data);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = api.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer profile fetch
        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    // THEN check for existing session
    api.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error, token } = await api.auth.signIn({
      email,
      password,
    });

    if (token) {
      localStorage.setItem("token", token);
      // Manually trigger session update
      const { data: sessionData } = await api.auth.getSession();
      setSession(sessionData.session);
      setUser(sessionData.session?.user ?? null);
      if (sessionData.session?.user) {
        fetchProfile(sessionData.session.user.id);
      }
    }

    return { error };
  };

  const signUp = async (email: string, password: string, firstName?: string, lastName?: string) => {
    const { data, error, token } = await api.auth.signUp({
      email,
      password,
      firstName,
      lastName
    });

    if (token) {
      localStorage.setItem("token", token);
    }

    return { error };
  };

  const signInWithGoogle = async () => {
     // For custom backend, this would involve a redirect to our backend's auth/google
     // Redirecting to mock for now as per replacement scope
     window.location.href = `${window.location.origin}/database`;
     return { error: null };
  };

  const signInWithPhone = async (phone: string) => {
    const { error } = await api.auth.signIn({ phone });
    return { error };
  };

  const verifyOTP = async (phone: string, token: string) => {
    const { error } = await api.auth.verifyOtp({ phone, token });
    return { error };
  };

  const resetPassword = async (email: string) => {
    const { error } = await api.auth.resetPassword(email);
    return { error };
  };

  const signOut = async () => {
    await api.auth.signOut();
    localStorage.removeItem("token");
    setSession(null);
    setUser(null);
    setProfile(null);
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error("No user logged in") };

    const { error } = await api.from("profiles")
      .update(updates)
      .eq("user_id", user.id);

    if (!error) {
      await fetchProfile(user.id);
    }

    return { error };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        signIn,
        signUp,
        signInWithGoogle,
        signInWithPhone,
        verifyOTP,
        resetPassword,
        signOut,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
