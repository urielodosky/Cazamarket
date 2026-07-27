'use client';

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Polygon, Polyline, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';

const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [20, 32],
  iconAnchor: [10, 32],
  popupAnchor: [1, -28],
  shadowSize: [32, 32]
});

// Detecta clics en el mapa para añadir vértices al área
function MapEvents({ isDrawingMode, onAddPoint }: { isDrawingMode: boolean, onAddPoint: (latlng: L.LatLng) => void }) {
  useMapEvents({
    click(e) {
      if (isDrawingMode) {
        onAddPoint(e.latlng);
      }
    }
  });
  return null;
  return null;
}

// Componente que controla el movimiento del mapa cuando el usuario ingresa una ubicación
function MapController({ locationText }: { locationText: string }) {
  const map = useMap();
  
  useEffect(() => {
    if (locationText && locationText.length > 5 && !locationText.includes('Ubicación exacta')) {
      const fetchCoords = async () => {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationText)}&format=json&limit=1`);
          const data = await res.json();
          if (data && data.length > 0) {
            map.flyTo([parseFloat(data[0].lat), parseFloat(data[0].lon)], 14);
          }
        } catch(e) {}
      }
      const timeoutId = setTimeout(() => {
        fetchCoords();
      }, 800);
      return () => clearTimeout(timeoutId);
    }
  }, [locationText, map]);
  return null;
}

export default function AreaMap({ isDrawingMode = false, points, setPoints, locationText, center, polygon, readOnly = false }: any) {
  const [internalPoints, setInternalPoints] = React.useState(polygon ? polygon.map((p: any) => ({ lat: p[0], lng: p[1] })) : (points || []));

  const handleAddPoint = (latlng: L.LatLng) => {
    const newPts = [...internalPoints, { lat: latlng.lat, lng: latlng.lng }];
    setInternalPoints(newPts);
    if (setPoints) setPoints(newPts);
  };

  const handleMarkerDragEnd = (index: number, e: any) => {
    const newLatLng = e.target.getLatLng();
    const newPts = [...internalPoints];
    newPts[index] = { lat: newLatLng.lat, lng: newLatLng.lng };
    setInternalPoints(newPts);
    if (setPoints) setPoints(newPts);
  };

  const polygonPositions = internalPoints.map((p: any) => [p.lat, p.lng]);

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative', zIndex: 10 }}>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <MapContainer 
        center={center ? center : [-39.0275, -67.5816]} // General Roca aprox.
        zoom={center ? 14 : 13} 
        style={{ width: '100%', height: '100%' }}
        // Si estamos dibujando, deshabilitamos el arrastre del mapa para no confundir los clics
        dragging={!readOnly && !isDrawingMode}
        scrollWheelZoom={!readOnly}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {(locationText && (!center && internalPoints.length === 0)) && <MapController locationText={locationText} />}
        
        {!readOnly && <MapEvents isDrawingMode={isDrawingMode} onAddPoint={handleAddPoint} />}
        
        {/* Renderiza los vértices arrastrables */}
        {!readOnly && internalPoints.map((pt: any, idx: number) => (
          <Marker 
            key={idx}
            position={[pt.lat, pt.lng]} 
            draggable={!readOnly} // Permite arrastrar los puntos libremente
            icon={customIcon}
            eventHandlers={readOnly ? {} : {
              dragend: (e) => handleMarkerDragEnd(idx, e)
            }}
          />
        ))}
        
        {/* Renderiza una línea si hay 2 puntos, o un polígono relleno si hay 3+ puntos */}
        {internalPoints.length === 2 && (
          <Polyline positions={polygonPositions} pathOptions={{ color: 'var(--color-primary)', weight: 3, dashArray: '6, 6' }} />
        )}
        {internalPoints.length > 2 && (
          <Polygon positions={polygonPositions} pathOptions={{ color: 'var(--color-primary)', fillColor: 'var(--color-primary)', fillOpacity: 0.3, weight: 3, dashArray: '6, 6' }} />
        )}
      </MapContainer>
    </div>
  );
}
