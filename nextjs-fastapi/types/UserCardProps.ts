import { Profile } from '@prisma/client';
import { UserInterestWithInterest } from './Interest';
import { UserArtistWithArtistandGenres } from './Artists';

export interface UserCardProps {
  data: Profile & {
    interests: Array<UserInterestWithInterest>;
    artists: Array<UserArtistWithArtistandGenres>;
  };
  active: boolean;
  removeCard: (id: string, action: 'right' | 'left') => void;
  disableActions?: boolean;
  displayMode?: 'stack' | 'grid';
} 