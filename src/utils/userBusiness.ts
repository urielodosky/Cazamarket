import { NEGOCIOS_DATA } from '@/data/mock';

export interface UserBusinessInfo {
  isBusiness: boolean;
  storeUrl?: string;
  badgeLabel: 'Negocio' | 'Comprador';
}

export function getUserBusinessInfo(authorName: string): UserBusinessInfo {
  if (!authorName) return { isBusiness: false, badgeLabel: 'Comprador' };

  const nameLow = authorName.toLowerCase().trim();

  // Check saved user profile in localStorage
  if (typeof window !== 'undefined') {
    const profileSaved = localStorage.getItem('cazamarket_profile');
    let hasUserStore = false;
    let storeSlugOrId = '';

    if (profileSaved) {
      try {
        const parsed = JSON.parse(profileSaved);
        if (parsed.storeName || parsed.nombreNegocio || parsed.cuit || parsed.tipoPersona === 'juridica') {
          hasUserStore = true;
          storeSlugOrId = parsed.storeId || parsed.storeSlug || encodeURIComponent(parsed.storeName || '1');
        }
      } catch (e) {}
    }

    // Check if user has created products or services
    try {
      const myProds = localStorage.getItem('cazamarket_my_products');
      const myServs = localStorage.getItem('cazamarket_my_services');
      if ((myProds && JSON.parse(myProds)?.length > 0) || (myServs && JSON.parse(myServs)?.length > 0)) {
        hasUserStore = true;
      }
    } catch (e) {}

    // Check if author matches logged user or Urielodo (who has digital business)
    const loggedUser = (localStorage.getItem('cazamarket_username') || 'Urielodo').toLowerCase();
    if (nameLow === loggedUser || nameLow === 'urielodo' || hasUserStore) {
      return {
        isBusiness: true,
        storeUrl: `/negocios/${storeSlugOrId || '1'}`,
        badgeLabel: 'Negocio'
      };
    }
  }

  // Check NEGOCIOS_DATA mock stores
  const mockMatch = NEGOCIOS_DATA.find(n => 
    n.name?.toLowerCase() === nameLow || 
    n.storeName?.toLowerCase() === nameLow ||
    n.id?.toString() === nameLow
  );
  if (mockMatch) {
    return {
      isBusiness: true,
      storeUrl: `/negocios/${mockMatch.id}`,
      badgeLabel: 'Negocio'
    };
  }

  // Fallback check for business keywords in name
  const businessKeywords = ['armerí', 'armeria', 'store', 'shop', 'deportes', 'outfit', 'market', 'outdoor'];
  if (businessKeywords.some(k => nameLow.includes(k))) {
    return {
      isBusiness: true,
      storeUrl: `/negocios/1`,
      badgeLabel: 'Negocio'
    };
  }

  return {
    isBusiness: false,
    badgeLabel: 'Comprador'
  };
}
