'use client';

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useState, useEffect } from 'react';
import heic2any from 'heic2any';

interface ImageUploadProps {
  currentImageUrl?: string | null;
  onImageSelect: (file: File) => void;
  size?: 'sm' | 'md' | 'lg';
  email?: string;
  isEditable?: boolean;
}

const sizeClasses = {
  sm: 'w-24 h-24',
  md: 'w-32 h-32',
  lg: 'w-40 h-40'
};

export default function ImageUpload({ 
  currentImageUrl, 
  onImageSelect, 
  size = 'md',
  email,
  isEditable = true
}: ImageUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);

  useEffect(() => {
    // Cleanup preview URL when component unmounts
    return () => {
      if (previewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }

    const file = event.target.files[0];
    
    try {
      // Check if the file is HEIC format
      if (file.type === 'image/heic' || file.type === 'image/heif') {
        // Convert HEIC to JPEG
        const jpegBlob = await heic2any({
          blob: file,
          toType: 'image/jpeg',
          quality: 0.85
        });
        
        // Convert blob to File
        const convertedFile = new File(
          [jpegBlob as Blob], 
          file.name.replace(/\.(heic|HEIC|heif|HEIF)$/, '.jpg'),
          { type: 'image/jpeg' }
        );
        
        const objectUrl = URL.createObjectURL(convertedFile);
        setPreviewUrl(objectUrl);
        onImageSelect(convertedFile);
      } else {
        // Handle non-HEIC images as before
        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);
        onImageSelect(file);
      }
    } catch (error) {
      console.error('Error processing image:', error);
      alert('Error processing image. Please try a different image or format.');
    }
  };

  return (
    <div className="relative">
      <Avatar className={`border-4 border-white ${sizeClasses[size]}`}>
        <AvatarImage
          src={previewUrl || ''}
          alt="Profile picture"
          className="object-cover"
        />
        <AvatarFallback className="text-2xl bg-gradient-to-r from-blue-500 to-purple-500 text-white">
          {email?.[0]?.toUpperCase() || '?'}
        </AvatarFallback>
      </Avatar>
      {isEditable && (
        <label className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 cursor-pointer rounded-full opacity-0 hover:opacity-100 transition-opacity">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />
          <span className="text-white text-sm">Change Photo</span>
        </label>
      )}
    </div>
  );
}