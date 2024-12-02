import { Activity } from '@prisma/client';

export type ActivityCardProps = {
  data: Activity;
  active: boolean;
  removeCard: (id: number, action: 'right' | 'left') => void;
}; 