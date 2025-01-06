import { Artist, Genre } from '@prisma/client';

export interface UserProfileData {
  age: number;
  gender: string | null;
  location: string | null;
  experienceLevel: number;
  preferredPace: number;
  preferredDistance: number;
  hobbies: string[];
  dogFriendly: boolean;
  transportation: number;
  spotifyConnected: boolean;
  topArtists?: (Omit<Artist, 'id' | 'createdAt' | 'updatedAt'> & {
    genres: Genre[];
  })[];
} 