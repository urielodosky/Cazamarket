'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type BusinessProfileContextType = {
  coverUrl: string;
  storeName: string;
  storeDescription: string;
  street: string;
  streetNumber: string;
  province: string;
  locality: string;
  socialMedia: any[];
  branches: any[];
  schedules: any[];
  storeTheme: any;
  storeCategories: any[];
  businessType: string;
  providers: any[];
  distributors: any[];
  trustScore: number;
  updateBusinessProfile: (data: { 
    coverUrl?: string, storeName?: string, storeDescription?: string, street?: string, streetNumber?: string, province?: string, locality?: string,
    socialMedia?: any[], branches?: any[], schedules?: any[],
    storeTheme?: any, storeCategories?: any[], businessType?: string,
    providers?: any[], distributors?: any[]
  }) => Promise<{ success: boolean; errors?: Record<string, string[]> }>;
};

const BusinessProfileContext = createContext<BusinessProfileContextType>({
  coverUrl: '',
  storeName: '',
  storeDescription: '',
  street: '',
  streetNumber: '',
  province: '',
  locality: '',
  socialMedia: [],
  branches: [],
  schedules: [],
  storeTheme: null,
  storeCategories: [],
  businessType: '',
  providers: [],
  distributors: [],
  trustScore: 0,
  updateBusinessProfile: async () => ({ success: false }),
});

export const BusinessProfileProvider = ({ children }: { children: ReactNode }) => {
  const supabase = createClient();
  const { supabaseUser } = useAuth();

  const [coverUrl, setCoverUrl] = useState('');
  const [storeName, setStoreName] = useState('');
  const [storeDescription, setStoreDescription] = useState('');
  const [street, setStreet] = useState('');
  const [streetNumber, setStreetNumber] = useState('');
  const [province, setProvince] = useState('');
  const [locality, setLocality] = useState('');
  const [socialMedia, setSocialMedia] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [storeTheme, setStoreTheme] = useState<any>(null);
  const [storeCategories, setStoreCategories] = useState<any[]>([]);
  const [businessType, setBusinessType] = useState('');
  const [providers, setProviders] = useState<any[]>([]);
  const [distributors, setDistributors] = useState<any[]>([]);
  const [trustScore, setTrustScore] = useState(0);

  useEffect(() => {
    const loadBusinessProfile = async () => {
      if (!supabaseUser) {
        setCoverUrl('');
        setStoreName('');
        setStoreDescription('');
        setStreet('');
        setStreetNumber('');
        setProvince('');
        setLocality('');
        setSocialMedia([]);
        setBranches([]);
        setSchedules([]);
        setStoreTheme(null);
        setStoreCategories([]);
        setBusinessType('');
        setProviders([]);
        setDistributors([]);
        setTrustScore(0);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('cover_url, store_name, store_description, street, street_number, province, locality, social_media, branches, schedules, store_theme, store_categories, business_type, providers, distributors, trust_score')
        .eq('id', supabaseUser.id)
        .single();

      if (profile) {
        setCoverUrl(profile.cover_url || '');
        setStoreName(profile.store_name || '');
        setStoreDescription(profile.store_description || '');
        setStreet(profile.street || '');
        setStreetNumber(profile.street_number || '');
        setProvince(profile.province || '');
        setLocality(profile.locality || '');
        setSocialMedia(profile.social_media || []);
        setBranches(profile.branches || []);
        setSchedules(profile.schedules || []);
        setStoreTheme(profile.store_theme || null);
        setStoreCategories(profile.store_categories || []);
        setBusinessType(profile.business_type || '');
        setProviders(profile.providers || []);
        setDistributors(profile.distributors || []);
        setTrustScore(profile.trust_score || 0);
      }
    };

    loadBusinessProfile();
  }, [supabaseUser, supabase]);

  const updateBusinessProfile = async (data: { 
    coverUrl?: string, storeName?: string, storeDescription?: string, street?: string, streetNumber?: string, province?: string, locality?: string,
    socialMedia?: any[], branches?: any[], schedules?: any[],
    storeTheme?: any, storeCategories?: any[], businessType?: string,
    providers?: any[], distributors?: any[]
  }): Promise<{ success: boolean; errors?: Record<string, string[]> }> => {
    if (supabaseUser) {
      const updates: any = {};
      if (data.coverUrl !== undefined) updates.cover_url = data.coverUrl;
      if (data.storeName !== undefined) updates.store_name = data.storeName;
      if (data.storeDescription !== undefined) updates.store_description = data.storeDescription;
      if (data.street !== undefined) updates.street = data.street;
      if (data.streetNumber !== undefined) updates.street_number = data.streetNumber;
      if (data.province !== undefined) updates.province = data.province;
      if (data.locality !== undefined) updates.locality = data.locality;
      if (data.socialMedia !== undefined) updates.social_media = data.socialMedia;
      if (data.branches !== undefined) updates.branches = data.branches;
      if (data.schedules !== undefined) updates.schedules = data.schedules;
      if (data.storeTheme !== undefined) updates.store_theme = data.storeTheme;
      if (data.storeCategories !== undefined) updates.store_categories = data.storeCategories;
      if (data.businessType !== undefined) updates.business_type = data.businessType;
      if (data.providers !== undefined) updates.providers = data.providers;
      if (data.distributors !== undefined) updates.distributors = data.distributors;

      const { error } = await supabase.from('profiles').update(updates).eq('id', supabaseUser.id);
      
      if (error) {
        console.error("Error updating business profile in Supabase:", error.message || 'Unknown error');
        return { success: false };
      }

      if (data.coverUrl !== undefined) setCoverUrl(data.coverUrl);
      if (data.storeName !== undefined) setStoreName(data.storeName);
      if (data.storeDescription !== undefined) setStoreDescription(data.storeDescription);
      if (data.street !== undefined) setStreet(data.street);
      if (data.streetNumber !== undefined) setStreetNumber(data.streetNumber);
      if (data.province !== undefined) setProvince(data.province);
      if (data.locality !== undefined) setLocality(data.locality);
      if (data.socialMedia !== undefined) setSocialMedia(data.socialMedia);
      if (data.branches !== undefined) setBranches(data.branches);
      if (data.schedules !== undefined) setSchedules(data.schedules);
      if (data.storeTheme !== undefined) setStoreTheme(data.storeTheme);
      if (data.storeCategories !== undefined) setStoreCategories(data.storeCategories);
      if (data.businessType !== undefined) setBusinessType(data.businessType);
      if (data.providers !== undefined) setProviders(data.providers);
      if (data.distributors !== undefined) setDistributors(data.distributors);

      return { success: true };
    } else {
      return { success: false };
    }
  };

  return (
    <BusinessProfileContext.Provider value={{ 
      coverUrl, storeName, storeDescription, street, streetNumber, province, locality,
      socialMedia, branches, schedules, storeTheme, storeCategories, businessType,
      providers, distributors, trustScore,
      updateBusinessProfile
    }}>
      {children}
    </BusinessProfileContext.Provider>
  );
};

export const useBusinessProfile = () => useContext(BusinessProfileContext);
