
export interface Hike {
    id: string;
    title: string;
    teaserText?: string;
    descriptionShort?: string;
    descriptionLong?: string;
    categoryId?: string;
    difficulty: number;
    landscapeRating?: number;
    experienceRating?: number;
    staminaRating?: number;
    length: number;
    ascent?: number;
    descent?: number;
    durationMin?: number;
    minAltitude?: number;
    maxAltitude?: number;
    pointLat?: number;
    pointLon?: number;
    isWinter?: boolean;
    isClosed?: boolean;
    primaryRegion?: string;
    primaryImageId?: string;
    publicTransportFriendly?: boolean;
    imageId?: string;
}
