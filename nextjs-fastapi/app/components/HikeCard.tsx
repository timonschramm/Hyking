import React from 'react';
import { Hike } from './chatBot/types';

interface HikeCardProps {
  hike: Hike;
  onClick?: () => void;
  detailed?: boolean; // Flag to render detailed view
}

const HikeCard: React.FC<HikeCardProps> = ({ hike, onClick, detailed = false }) => {
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
        {hike.teaserText && <p className="text-gray-600 mt-2">{hike.teaserText}</p>}
        {detailed && hike.descriptionLong && (
          <p className="text-gray-700 mt-4 leading-relaxed">{hike.descriptionLong}</p>
        )}
      </div>

      {/* Detailed Information */}
      {detailed && (
        <div className="px-6 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-gray-700">
            <div>
              <p><strong>Length:</strong> {hike.length} km</p>
              <p><strong>Ascent:</strong> {hike.ascent || 'N/A'} m</p>
              <p><strong>Descent:</strong> {hike.descent || 'N/A'} m</p>
              <p><strong>Duration:</strong> {hike.durationMin || 'N/A'} mins</p>
            </div>
            <div>
              <p><strong>Min Altitude:</strong> {hike.minAltitude || 'N/A'} m</p>
              <p><strong>Max Altitude:</strong> {hike.maxAltitude || 'N/A'} m</p>
              <p><strong>Difficulty:</strong> {hike.difficulty}/5</p>
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
            <p>
              <strong>Coordinates:</strong> {hike.pointLat}, {hike.pointLon}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default HikeCard;
