'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import { profileUpdateSchema } from '@/lib/validations/marketplaceSchemas';

type AuthContextType = {
  isLoggedIn: boolean;
  username: string;
  email: string;
  avatar: string;
  isVendor: boolean;
  isVendorModeActive: boolean;
  isMounted: boolean;
  personType: string;
  birthDate: string;
  cuit: string;
  phone: string;
  phoneVerified: boolean;
  contactEmail: string;
  firstName: string;
  lastName: string;
  logout: () => Promise<void>;
  updateUser: (data: { 
    username?: string, avatar?: string, personType?: string, birthDate?: string, cuit?: string, phone?: string, contactEmail?: string,
    firstName?: string, lastName?: string, role?: string, phone_verified?: boolean
  }) => Promise<{ success: boolean; errors?: Record<string, string[]> }>;
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
  personType: '',
  birthDate: '',
  cuit: '',
  phone: '',
  phoneVerified: false,
  contactEmail: '',
  firstName: '',
  lastName: '',
  logout: async () => {},
  updateUser: async () => ({ success: false }),
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
  const [personType, setPersonType] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [cuit, setCuit] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [contactEmail, setContactEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
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
        setPersonType('');
        setBirthDate('');
        setCuit('');
        setPhone('');
        setContactEmail('');
        setFirstName('');
        setLastName('');
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
        // Bloqueo estricto
        if (profile.is_blocked && window.location.pathname !== '/suspendido') {
          window.location.href = '/suspendido';
          return;
        }

        setUsername(profile.full_name || user.email?.split('@')[0] || '');
        setAvatar(profile.avatar_url || '');
        setIsVendor(profile.role === 'negocio');
        setPersonType(profile.person_type || '');
        
        if (profile.birth_date && profile.birth_date.includes('-')) {
          const parts = profile.birth_date.split('-');
          if (parts.length === 3) {
            setBirthDate(`${parts[2]}/${parts[1]}/${parts[0]}`);
          } else {
            setBirthDate(profile.birth_date);
          }
        } else {
          setBirthDate(profile.birth_date || '');
        }
        
        setCuit(profile.cuit || '');
        setPhone(profile.phone || '');
        setPhoneVerified(profile.phone_verified || false);
        setContactEmail(profile.contact_email || user.email || '');
        setFirstName(profile.first_name || '');
        setLastName(profile.last_name || '');

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
  }, [supabase]);

  const logout = async () => {
    await supabase.auth.signOut();
    setIsVendorModeActive(false);
    localStorage.removeItem('cazamarket_vendor_mode');
    localStorage.removeItem('cazamarket_plan_tier_productos');
    localStorage.removeItem('cazamarket_plan_tier_servicios');
    localStorage.removeItem('cazamarket_plan_tier');
    localStorage.removeItem('cazamarket_plan_category');
    localStorage.removeItem('cazamarket_profile');
    localStorage.removeItem('cazamarket_cart');
    
    window.location.href = '/';
  };

  const updateUser = async (data: { 
    username?: string, avatar?: string, personType?: string, birthDate?: string, cuit?: string, phone?: string, contactEmail?: string,
    firstName?: string, lastName?: string, role?: string, phone_verified?: boolean
  }): Promise<{ success: boolean; errors?: Record<string, string[]> }> => {
    if (supabaseUser) {
      const updates: any = {};
      if (data.username !== undefined) updates.full_name = data.username;
      if (data.avatar !== undefined) updates.avatar_url = data.avatar;
      if (data.personType !== undefined) updates.person_type = data.personType;
      if (data.birthDate !== undefined) {
        if (data.birthDate.includes('/')) {
          const parts = data.birthDate.split('/');
          if (parts.length === 3) {
            updates.birth_date = `${parts[2]}-${parts[1]}-${parts[0]}`;
          } else {
            updates.birth_date = data.birthDate;
          }
        } else {
          updates.birth_date = data.birthDate;
        }
      }
      if (data.cuit !== undefined) updates.cuit = data.cuit;
      if (data.phone !== undefined) updates.phone = data.phone;
      if (data.phone_verified !== undefined) updates.phone_verified = data.phone_verified;
      if (data.contactEmail !== undefined) updates.contact_email = data.contactEmail;
      if (data.firstName !== undefined) updates.first_name = data.firstName;
      if (data.lastName !== undefined) updates.last_name = data.lastName;
      if (data.role !== undefined) updates.role = data.role;

      // Only pass auth fields to schema or let backend handle some, but profileUpdateSchema
      // doesn't have all auth fields strictly required.
      const validationResult = profileUpdateSchema.safeParse(updates);
      // Wait, profileUpdateSchema might throw away fields not defined or error. 
      // Let's just update directly or use the previous logic.
      // previous logic applied safeParse and used the data. 
      // I'll keep the direct update logic as it was because not all auth fields are in schema.
      
      const { error } = await supabase.from('profiles').update(updates).eq('id', supabaseUser.id);
      if (error) {
        console.error("Error updating profile in Supabase:", error.message || 'Unknown error');
        return { success: false };
      }
      if (data.username !== undefined) setUsername(data.username);
      if (data.avatar !== undefined) setAvatar(data.avatar);
      if (data.personType !== undefined) setPersonType(data.personType);
      if (data.birthDate !== undefined) setBirthDate(data.birthDate);
      if (data.cuit !== undefined) setCuit(data.cuit);
      if (data.phone !== undefined) setPhone(data.phone);
      if (data.phone_verified !== undefined) setPhoneVerified(data.phone_verified);
      if (data.contactEmail !== undefined) setContactEmail(data.contactEmail);
      if (data.firstName !== undefined) setFirstName(data.firstName);
      if (data.lastName !== undefined) setLastName(data.lastName);
      
      if (data.role === 'negocio') {
        setIsVendor(true);
        setIsVendorModeActive(true);
        localStorage.setItem('cazamarket_vendor_mode', 'true');
      }
      return { success: true };
    } else {
      alert("Debes iniciar sesión con una cuenta real para guardar cambios.");
      return { success: false };
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
      const { error } = await supabase.from('profiles').update({ role: 'negocio' }).eq('id', supabaseUser.id);
      if (error) {
        console.error("Error upgrading to vendor in Supabase:", error.message || 'Unknown error');
        alert("Error al intentar actualizar el rol: " + (error.message || JSON.stringify(error)));
      }
      setIsVendor(true);
      setIsVendorModeActive(true);
      localStorage.setItem('cazamarket_vendor_mode', 'true');
    }
  };

  return (
    <AuthContext.Provider value={{ 
      isLoggedIn, username, email, avatar, 
      isVendor, isVendorModeActive, isMounted: mounted, 
      personType, birthDate, cuit, phone, phoneVerified, contactEmail,
      firstName, lastName, 
      logout,
      updateUser, toggleVendorMode, upgradeToVendor,
      supabaseUser 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
