'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type FavoriteType = 'negocios' | 'productos' | 'servicios';

interface FavoritesContextType {
  favorites: Record<FavoriteType, string[]>;
  toggleFavorite: (type: FavoriteType, id: string) => void;
  isFavorite: (type: FavoriteType, id: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<Record<FavoriteType, string[]>>({
    negocios: [],
    productos: [],
    servicios: []
  });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('cazamarket_favorites');
    if (saved) {
      try {
        setFavorites(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse favorites', e);
      }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('cazamarket_favorites', JSON.stringify(favorites));
    }
  }, [favorites, isLoaded]);

  const toggleFavorite = (type: FavoriteType, id: string) => {
    setFavorites(prev => {
      const currentList = prev[type];
      if (currentList.includes(id)) {
        return { ...prev, [type]: currentList.filter(itemId => itemId !== id) };
      } else {
        return { ...prev, [type]: [...currentList, id] };
      }
    });
  };

  const isFavorite = (type: FavoriteType, id: string) => {
    return favorites[type].includes(id);
  };

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}
