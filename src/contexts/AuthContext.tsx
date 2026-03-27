import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: { full_name: string; avatar_url: string | null } | null;
  loading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<{ full_name: string; avatar_url: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const requestIdRef = useRef(0);

  const resetUserData = () => {
    setProfile(null);
    setIsAdmin(false);
  };

  const loadUserData = async (userId: string) => {
    const requestId = ++requestIdRef.current;
    resetUserData();

    const [{ data: profileData }, { data: roleData }] = await Promise.all([
      supabase.from("profiles").select("full_name, avatar_url").eq("user_id", userId).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle(),
    ]);

    if (requestId !== requestIdRef.current) return;

    setProfile(profileData ?? null);
    setIsAdmin(!!roleData);
  };

  useEffect(() => {
    let isMounted = true;
    let initialized = false;

    const applySession = (session: Session | null) => {
      if (!isMounted) return;

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        void loadUserData(session.user.id);
      } else {
        requestIdRef.current += 1;
        resetUserData();
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      initialized = true;
      applySession(session);
      if (isMounted) setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!initialized) return;
      applySession(session);
      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, isAdmin, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
