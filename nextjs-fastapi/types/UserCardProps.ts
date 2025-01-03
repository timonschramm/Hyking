import { Profile } from '@prisma/client';
import { UserInterestWithInterest } from './Interest';
import { UserArtistWithArtist } from './Artists';

export interface UserCardProps {
  data: Profile & {
    interests: Array<UserInterestWithInterest>;
    artists: Array<UserArtistWithArtist>;
  };
  active: boolean;
  removeCard: (id: string, action: 'right' | 'left') => void;
} 