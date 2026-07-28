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
  personType: string;
  birthDate: string;
  cuit: string;
  phone: string;
  contactEmail: string;
  firstName: string;
  lastName: string;
  storeName: string;
  storeDescription: string;
  street: string;
  streetNumber: string;
  province: string;
  locality: string;
  socialMedia: any[];
  branches: any[];
  schedules: any[];
  logout: () => Promise<void>;
  updateUser: (data: { 
    username?: string, avatar?: string, personType?: string, birthDate?: string, cuit?: string, phone?: string, contactEmail?: string,
    firstName?: string, lastName?: string, storeName?: string, storeDescription?: string, street?: string, streetNumber?: string, province?: string, locality?: string,
    socialMedia?: any[], branches?: any[], schedules?: any[]
  }) => Promise<void>;
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
  contactEmail: '',
  firstName: '',
  lastName: '',
  storeName: '',
  storeDescription: '',
  street: '',
  streetNumber: '',
  province: '',
  locality: '',
  socialMedia: [],
  branches: [],
  schedules: [],
  logout: async () => {},
  updateUser: async () => {},
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
  const [contactEmail, setContactEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [storeName, setStoreName] = useState('');
  const [storeDescription, setStoreDescription] = useState('');
  const [street, setStreet] = useState('');
  const [streetNumber, setStreetNumber] = useState('');
  const [province, setProvince] = useState('');
  const [locality, setLocality] = useState('');
  const [socialMedia, setSocialMedia] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
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
        setStoreName('');
        setStoreDescription('');
        setStreet('');
        setStreetNumber('');
        setProvince('');
        setLocality('');
        setSocialMedia([]);
        setBranches([]);
        setSchedules([]);
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
        console.log("PROFILE FETCHED FROM SUPABASE:", profile);
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
        setContactEmail(profile.contact_email || user.email || '');
        setFirstName(profile.first_name || '');
        setLastName(profile.last_name || '');
        setStoreName(profile.store_name || '');
        setStoreDescription(profile.store_description || '');
        setStreet(profile.street || '');
        setStreetNumber(profile.street_number || '');
        setProvince(profile.province || '');
        setLocality(profile.locality || '');
        setSocialMedia(profile.social_media || []);
        setBranches(profile.branches || []);
        setSchedules(profile.schedules || []);
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

  const updateUser = async (data: { 
    username?: string, avatar?: string, personType?: string, birthDate?: string, cuit?: string, phone?: string, contactEmail?: string,
    firstName?: string, lastName?: string, storeName?: string, storeDescription?: string, street?: string, streetNumber?: string, province?: string, locality?: string,
    socialMedia?: any[], branches?: any[], schedules?: any[], role?: string
  }) => {
    // Actualizar base de datos
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
      if (data.contactEmail !== undefined) updates.contact_email = data.contactEmail;
      if (data.firstName !== undefined) updates.first_name = data.firstName;
      if (data.lastName !== undefined) updates.last_name = data.lastName;
      if (data.storeName !== undefined) updates.store_name = data.storeName;
      if (data.storeDescription !== undefined) updates.store_description = data.storeDescription;
      if (data.street !== undefined) updates.street = data.street;
      if (data.streetNumber !== undefined) updates.street_number = data.streetNumber;
      if (data.province !== undefined) updates.province = data.province;
      if (data.locality !== undefined) updates.locality = data.locality;
      if (data.socialMedia !== undefined) updates.social_media = data.socialMedia;
      if (data.branches !== undefined) updates.branches = data.branches;
      if (data.schedules !== undefined) updates.schedules = data.schedules;
      if (data.role !== undefined) updates.role = data.role;
      const { error } = await supabase.from('profiles').update(updates).eq('id', supabaseUser.id);
      if (error) {
        console.error("Error updating profile in Supabase:", error);
        alert("Error al guardar en base de datos: " + (error.message || JSON.stringify(error)));
      }
      
      if (data.username !== undefined) setUsername(data.username);
      if (data.avatar !== undefined) setAvatar(data.avatar);
      if (data.personType !== undefined) setPersonType(data.personType);
      if (data.birthDate !== undefined) setBirthDate(data.birthDate);
      if (data.cuit !== undefined) setCuit(data.cuit);
      if (data.phone !== undefined) setPhone(data.phone);
      if (data.contactEmail !== undefined) setContactEmail(data.contactEmail);
      if (data.firstName !== undefined) setFirstName(data.firstName);
      if (data.lastName !== undefined) setLastName(data.lastName);
      if (data.storeName !== undefined) setStoreName(data.storeName);
      if (data.storeDescription !== undefined) setStoreDescription(data.storeDescription);
      if (data.street !== undefined) setStreet(data.street);
      if (data.streetNumber !== undefined) setStreetNumber(data.streetNumber);
      if (data.province !== undefined) setProvince(data.province);
      if (data.locality !== undefined) setLocality(data.locality);
      if (data.socialMedia !== undefined) setSocialMedia(data.socialMedia);
      if (data.branches !== undefined) setBranches(data.branches);
      if (data.schedules !== undefined) setSchedules(data.schedules);
      if (data.role === 'negocio') {
        setIsVendor(true);
        setIsVendorModeActive(true);
        localStorage.setItem('cazamarket_vendor_mode', 'true');
      }
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
        console.error("Error upgrading to vendor in Supabase:", error);
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
      personType, birthDate, cuit, phone, contactEmail,
      firstName, lastName, storeName, storeDescription, street, streetNumber, province, locality,
      socialMedia, branches, schedules,
      logout, updateUser, toggleVendorMode, upgradeToVendor,
      supabaseUser 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
