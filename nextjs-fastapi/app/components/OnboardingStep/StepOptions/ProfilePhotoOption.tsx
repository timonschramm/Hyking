'use client';

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import React, { useState } from 'react';

interface ProfilePhotoOptionProps {
  formData: {
    imageFile?: File | null;
    email?: string;
    imageUrl?: string | null;
  };
  onPhotoSelect: (file: File) => void;
}

export default function ProfilePhotoOption({ formData, onPhotoSelect }: ProfilePhotoOptionProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(formData.imageUrl || null);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }

    const file = event.target.files[0];
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    onPhotoSelect(file);
  };

  // Cleanup preview URL when component unmounts
  React.useEffect(() => {
    return () => {
      if (previewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative">
        <Avatar className="w-32 h-32">
          <AvatarImage 
            src={previewUrl || formData.imageUrl || ''} 
            alt="Profile picture" 
          />
          <AvatarFallback className="text-2xl bg-gradient-to-r from-blue-500 to-purple-500 text-white">
            {formData.email?.[0]?.toUpperCase() || '?'}
          </AvatarFallback>
        </Avatar>
        
        <label 
          className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 
                     cursor-pointer rounded-full opacity-0 hover:opacity-100 transition-opacity"
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />
          <span className="text-white text-sm">
            {formData.imageUrl || previewUrl ? 'Change Photo' : 'Add Photo'}
          </span>
        </label>
      </div>

      <p className="text-sm text-gray-500">
        Click to {formData.imageUrl || previewUrl ? 'change' : 'upload'} your profile photo
      </p>
    </div>
  );
} 