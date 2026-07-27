'use client';

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Configuramos los íconos de Leaflet para que funcionen correctamente en Next.js
const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Componente que controla el movimiento del mapa cuando el usuario escribe en el input
function MapController({ locationText, setDynamicPos }: { locationText: string, setDynamicPos?: (pos: L.LatLng) => void }) {
  const map = useMap();
  
  useEffect(() => {
    // Si la dirección cambia desde el input y no fue un clic en el mapa, buscamos las coordenadas para centrar
    if (locationText && locationText.length > 5 && !locationText.includes('Ubicación exacta')) {
      const fetchCoords = async () => {
        try {
          // Buscamos solo el primer resultado de la API
          const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationText)}&format=json&limit=1`);
          const data = await res.json();
          if (data && data.length > 0) {
            const latlng = new L.LatLng(parseFloat(data[0].lat), parseFloat(data[0].lon));
            map.flyTo(latlng, 15);
            if (setDynamicPos) setDynamicPos(latlng);
          }
        } catch(e) {}
      }
      // Pequeño timeout para no saturar si están escribiendo rápido
      const timeoutId = setTimeout(() => {
        fetchCoords();
      }, 800);
      return () => clearTimeout(timeoutId);
    }
  }, [locationText, map]);
  return null;
}

// Componente que maneja los clics en el mapa
function LocationPicker({ position, setPosition, onAddressFound }: any) {
  useMapEvents({
    // Al hacer doble clic
    dblclick(e) {
      setPosition(e.latlng);
      reverseGeocode(e.latlng.lat, e.latlng.lng, onAddressFound);
    },
    // Al hacer clic derecho o mantener presionado en móviles (contextmenu)
    contextmenu(e) {
      setPosition(e.latlng);
      reverseGeocode(e.latlng.lat, e.latlng.lng, onAddressFound);
    }
  });

  return position === null ? null : (
    <Marker position={position} icon={customIcon} />
  );
}

// Función que convierte coordenadas en dirección (Geocodificación inversa)
const reverseGeocode = async (lat: number, lng: number, callback: (addr: string) => void) => {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
    const data = await res.json();
    if (data && data.display_name) {
      // Reemplazamos el input del formulario con la dirección real extraída del mapa
      callback(data.display_name);
    }
  } catch (error) {
    console.error("Error al obtener la dirección del mapa:", error);
  }
};

export default function LocationMap({ locationText = '', setLocationText, position: defaultPos, readOnly = false, onPositionChange }: { locationText?: string, setLocationText?: (t: string) => void, position?: [number, number], readOnly?: boolean, onPositionChange?: (pos: [number, number]) => void }) {
  const [position, setPosition] = useState<L.LatLng | null>(defaultPos ? new L.LatLng(defaultPos[0], defaultPos[1]) : null);
  const [dynamicPos, setDynamicPos] = useState<L.LatLng | null>(null);

  useEffect(() => {
    if (position && onPositionChange) {
      onPositionChange([position.lat, position.lng]);
    }
  }, [position, onPositionChange]);

  const displayPos = defaultPos ? new L.LatLng(defaultPos[0], defaultPos[1]) : dynamicPos;

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative', zIndex: 10 }}>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <MapContainer 
        center={defaultPos ? defaultPos : [-34.6037, -58.3816]} // Por defecto en el centro de Argentina/BsAs
        zoom={defaultPos ? 15 : 5} 
        scrollWheelZoom={!readOnly} 
        dragging={!readOnly}
        style={{ width: '100%', height: '100%' }}
        doubleClickZoom={false} // Desactivamos el zoom con doble clic para usarlo para tirar pines
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {(locationText && !defaultPos) && <MapController locationText={locationText} setDynamicPos={setDynamicPos} />}
        {!readOnly ? (
          <LocationPicker 
            position={position} 
            setPosition={setPosition} 
            onAddressFound={(addr: string) => {
              if (setLocationText) setLocationText(addr);
            }}
          />
        ) : (
          displayPos && <Marker position={displayPos} icon={customIcon} />
        )}
      </MapContainer>
      
      {/* Etiqueta de ayuda superpuesta */}
      {!readOnly && (
        <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 1000, background: 'rgba(255, 115, 0, 0.9)', padding: '6px 14px', borderRadius: 'var(--radius-full)', color: '#fff', fontSize: '0.8rem', fontWeight: 600, pointerEvents: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
          Doble clic o mantener para soltar pin
        </div>
      )}
    </div>
  );
}
