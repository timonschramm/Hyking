'use client'

import React from 'react';
import { Hike } from './chatBot/types';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import type { Icon as LeafletIcon } from 'leaflet';
import type { MapContainer as LeafletMapContainer, TileLayer as LeafletTileLayer } from 'react-leaflet';

// Dynamically import the map components to avoid SSR issues
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
) as typeof LeafletMapContainer;

const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
) as typeof LeafletTileLayer;

const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);

const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

interface HikeCardProps {
  hike: Hike;
  onClick?: () => void;
  detailed?: boolean; // Flag to render detailed view
}

const HikeCard: React.FC<HikeCardProps> = ({ hike, onClick, detailed = false }) => {
  // Create a ref for the map icon to avoid SSR mismatch
  const [icon, setIcon] = React.useState<LeafletIcon | null>(null);

  React.useEffect(() => {
    // Import the icon on the client side
    import('leaflet').then((L) => {
      setIcon(
        new L.Icon({
          iconUrl: '/images/marker-icon.png',
          iconRetinaUrl: '/images/marker-icon-2x.png',
          shadowUrl: '/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
        })
      );
    });
  }, []);

  return (
    <div
      className={`bg-white rounded-lg shadow-lg overflow-hidden ${
        onClick ? 'cursor-pointer hover:shadow-xl transition-shadow' : ''
      }`}
      onClick={onClick}
    >
      {/* Image Section */}
      <div className="h-64 bg-gray-200">
        {hike.primaryImageId ? (
          <img
            src={`https://img.oastatic.com/img2/${hike.primaryImageId}/default/variant.jpg`}
            alt={hike.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            No Image Available
          </div>
        )}
      </div>

      {/* Basic Information */}
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-800">{hike.title}</h2>
        {hike.teaserText && <p className="text-gray-600 mt-2">{hike.teaserText.replace(/<[^>]*>/g, '')}</p>}
        {detailed && hike.descriptionLong && (
          <p className="text-gray-700 mt-4 leading-relaxed">{hike.descriptionLong.replace(/<[^>]*>/g, '')}</p>
        )}
      </div>

      {/* Detailed Information */}
      {detailed && (
        <div className="px-6 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-gray-700">
            <div>
              <p><strong>Length:</strong> {hike.length} m</p>
              <p><strong>Ascent:</strong> {hike.ascent || 'N/A'} m</p>
              <p><strong>Descent:</strong> {hike.descent || 'N/A'} m</p>
              <p><strong>Duration:</strong> {hike.durationMin || 'N/A'} mins</p>
            </div>
            <div>
              <p><strong>Min Altitude:</strong> {hike.minAltitude || 'N/A'} m</p>
              <p><strong>Max Altitude:</strong> {hike.maxAltitude || 'N/A'} m</p>
              <p><strong>Difficulty:</strong> {hike.difficulty}/3</p>
              <p><strong>Is Winter Friendly:</strong> {hike.isWinter ? 'Yes' : 'No'}</p>
            </div>
          </div>

          <div>
            <p><strong>Landscape Rating:</strong> {hike.landscapeRating || 'N/A'}</p>
            <p><strong>Experience Rating:</strong> {hike.experienceRating || 'N/A'}</p>
            <p><strong>Stamina Rating:</strong> {hike.staminaRating || 'N/A'}</p>
          </div>

          {hike.primaryRegion && (
            <p>
              <strong>Primary Region:</strong> {hike.primaryRegion}
            </p>
          )}

          {hike.publicTransportFriendly !== undefined && (
            <p>
              <strong>Public Transport Friendly:</strong> {hike.publicTransportFriendly ? 'Yes' : 'No'}
            </p>
          )}

          {hike.isClosed !== undefined && (
            <p>
              <strong>Status:</strong> {hike.isClosed ? 'Closed' : 'Open'}
            </p>
          )}

          {hike.pointLat && hike.pointLon && (
            <div className="mt-4">
              <p className="mb-2">
                <strong>Coordinates:</strong> {hike.pointLat}, {hike.pointLon}
              </p>
              <div className="h-[300px] w-full rounded-lg overflow-hidden">
                {icon && (
                  <MapContainer
                    center={[Number(hike.pointLat), Number(hike.pointLon)]}
                    zoom={13}
                    scrollWheelZoom={false}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    <Marker 
                      position={[Number(hike.pointLat), Number(hike.pointLon)]} 
                      icon={icon}
                    >
                      <Popup>
                        {hike.title}
                      </Popup>
                    </Marker>
                  </MapContainer>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HikeCard;
