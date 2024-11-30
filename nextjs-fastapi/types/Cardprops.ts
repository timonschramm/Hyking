import { CardData } from '@/types/CardData';

export type CardProps = {
    data: CardData;
    active: boolean;
    removeCard: (id: number, action: 'right' | 'left') => void;
  };  