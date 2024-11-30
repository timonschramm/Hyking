import { StaticImageData } from 'next/image';


export type CardData = {
    id: number;
    name: string;
    src: StaticImageData;
    age: number;
    bio: string;
    genre: string[];
    tracks: TracksData[];
  };