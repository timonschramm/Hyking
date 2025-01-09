import { Profile, UserSkill, Skill, SkillLevel } from '@prisma/client';
import { UserInterestWithInterest } from './Interest';
import { UserArtistWithArtistandGenres } from './Artists';

export interface UserCardProps {
  data: Profile & {
    interests: Array<UserInterestWithInterest>;
    artists: Array<UserArtistWithArtistandGenres>;
    skills: Array<UserSkill & {
      skill: Skill;
      skillLevel: SkillLevel;
    }>;
  };
  active: boolean;
  removeCard: (id: string, action: 'right' | 'left') => void;
  disableActions?: boolean;
  displayMode?: 'stack' | 'grid';
} 