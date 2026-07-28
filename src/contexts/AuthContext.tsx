'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';

type AuthContextType = {
  isLoggedIn: boolean;
  username: string;
  email: string;
  avatar: string;
  isVendor: boolean;
  isVendorModeActive: boolean;
  isMounted: boolean;
  logout: () => Promise<void>;
  updateUser: (user: string, email: string, avatar?: string) => void;
  toggleVendorMode: () => void;
  upgradeToVendor: () => Promise<void>;
  supabaseUser: any;
};

const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  username: '',
  email: '',
  avatar: '',
  isVendor: false,
  isVendorModeActive: false,
  isMounted: false,
  logout: async () => {},
  updateUser: () => {},
  toggleVendorMode: () => {},
  upgradeToVendor: async () => {},
  supabaseUser: null,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const supabase = createClient();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [avatar, setAvatar] = useState('');
  const [isVendor, setIsVendor] = useState(false);
  const [isVendorModeActive, setIsVendorModeActive] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [supabaseUser, setSupabaseUser] = useState<any>(null);

  useEffect(() => {
    // Restaurar vendor mode de localStorage solo para preferencia visual local
    const storedVendorMode = localStorage.getItem('cazamarket_vendor_mode');
    if (storedVendorMode === 'true') setIsVendorModeActive(true);

    const loadProfile = async (user: any) => {
      if (!user) {
        setIsLoggedIn(false);
        setSupabaseUser(null);
        setUsername('');
        setEmail('');
        setIsVendor(false);
        return;
      }

      setSupabaseUser(user);
      setIsLoggedIn(true);
      setEmail(user.email || '');

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) {
        setUsername(profile.full_name || user.email?.split('@')[0] || '');
        setAvatar(profile.avatar_url || '');
        setIsVendor(profile.role === 'negocio');
        if (profile.role !== 'negocio') {
          setIsVendorModeActive(false);
          localStorage.setItem('cazamarket_vendor_mode', 'false');
        }
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      loadProfile(session?.user ?? null).finally(() => setMounted(true));
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      loadProfile(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    setIsVendorModeActive(false);
    localStorage.removeItem('cazamarket_vendor_mode');
    // Limpiar claves genéricas antiguas (las per-usuario se quedan, no molestan)
    localStorage.removeItem('cazamarket_plan_tier_productos');
    localStorage.removeItem('cazamarket_plan_tier_servicios');
    localStorage.removeItem('cazamarket_plan_tier');
    localStorage.removeItem('cazamarket_plan_category');
    localStorage.removeItem('cazamarket_profile');
    
    // Forzar recarga completa para limpiar los estados de react que dependen de localStorage
    window.location.href = '/';
  };

  const updateUser = async (newUser: string, newEmail: string, newAvatar?: string) => {
    // Actualizar base de datos
    if (supabaseUser) {
      await supabase.from('profiles').update({
        full_name: newUser,
        ...(newAvatar !== undefined ? { avatar_url: newAvatar } : {})
      }).eq('id', supabaseUser.id);
      
      setUsername(newUser);
      if (newAvatar !== undefined) setAvatar(newAvatar);
    }
  };

  const toggleVendorMode = () => {
    if (isVendor) {
      const newMode = !isVendorModeActive;
      setIsVendorModeActive(newMode);
      localStorage.setItem('cazamarket_vendor_mode', newMode ? 'true' : 'false');
    }
  };

  const upgradeToVendor = async () => {
    if (supabaseUser) {
      await supabase.from('profiles').update({ role: 'negocio' }).eq('id', supabaseUser.id);
      setIsVendor(true);
      setIsVendorModeActive(true);
      localStorage.setItem('cazamarket_vendor_mode', 'true');
    }
  };

  return (
    <AuthContext.Provider value={{ 
      isLoggedIn, username, email, avatar, 
      isVendor, isVendorModeActive, isMounted: mounted, 
      logout, updateUser, toggleVendorMode, upgradeToVendor,
      supabaseUser 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
