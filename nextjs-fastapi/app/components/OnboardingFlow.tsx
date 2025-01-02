import { useState, useEffect } from 'react';
import OnboardingStep from './OnboardingStep';
import { Progress } from "@/components/ui/progress";
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';
import { UserProfileData } from '@/types/UserData';
import SpotifyArtistsDisplay from './SpotifyArtistsDisplay';
import { Skeleton } from "@/components/ui/skeleton";
import { SpotifyArtistsDisplaySkeleton } from './SpotifyArtistsDisplay';
import { Prisma } from '@prisma/client';
import { ExperienceLevel, PreferredPace, PreferredDistance, Transportation } from '@prisma/client';
import { ProfileWithArtistsAndInterests } from '../types/profile';
// Use Prisma's utility types for Artist with relations
type ArtistWithRelations = Prisma.ArtistGetPayload<{
  include: {
    genres: true;
    profiles: true;
  }
}>;

type ProfileWithAllData = Prisma.ProfileGetPayload<{
  include: {
    artists: {
      include: {
        artist: {
          include: {
            genres: true
          }
        }
      }
    }
    interests: {
      include: {
        interest: true
      }
    }
  }
}>;

interface OnboardingFlowProps {
  initialData: ProfileWithAllData;
}

interface FormData {
  artists: Array<{
    id: string;
    name: string;
    imageUrl: string | null;
    spotifyId: string;
    createdAt: Date;
    updatedAt: Date;
    genres: Array<{ name: string; id: string; }>;
  }>;
  spotifyConnected?: boolean;
  age?: string;
  gender?: string;
  location?: string;
  experienceLevel?: string;
  preferredPace?: string;
  preferredDistance?: string;
  interests?: string[];
  dogFriendly?: boolean;
  transportation?: string;
}

// Add type-safe mappings
const EXPERIENCE_LEVEL_MAP: Record<ExperienceLevel, string> = {
  BEGINNER: 'Beginner (0-1)',
  INTERMEDIATE: 'Intermediate (1-2)',
  ADVANCED: 'Advanced (2-3)',
  EXPERT: 'Expert (3)'
};

const PREFERRED_PACE_MAP: Record<PreferredPace, string> = {
  LEISURELY: 'Leisurely',
  MODERATE: 'Moderate',
  FAST: 'Fast',
  VERY_FAST: 'Very Fast'
};

const PREFERRED_DISTANCE_MAP: Record<PreferredDistance, string> = {
  SHORT: '1-5 km',
  MEDIUM: '5-10 km',
  LONG: '10-20 km',
  VERY_LONG: '20+ km'
};

const TRANSPORTATION_MAP: Record<Transportation, string> = {
  CAR: 'Car',
  PUBLIC_TRANSPORT: 'Public Transport',
  BOTH: 'Both'
};

// Add reverse mappings for form submission
const REVERSE_EXPERIENCE_LEVEL_MAP = Object.entries(EXPERIENCE_LEVEL_MAP)
  .reduce((acc, [key, value]) => ({ ...acc, [value]: key }), {}) as Record<string, ExperienceLevel>;

const REVERSE_PREFERRED_PACE_MAP = Object.entries(PREFERRED_PACE_MAP)
  .reduce((acc, [key, value]) => ({ ...acc, [value]: key }), {}) as Record<string, PreferredPace>;

const REVERSE_PREFERRED_DISTANCE_MAP = Object.entries(PREFERRED_DISTANCE_MAP)
  .reduce((acc, [key, value]) => ({ ...acc, [value]: key }), {}) as Record<string, PreferredDistance>;

const REVERSE_TRANSPORTATION_MAP = Object.entries(TRANSPORTATION_MAP)
  .reduce((acc, [key, value]) => ({ ...acc, [value]: key }), {}) as Record<string, Transportation>;

  
export default function OnboardingFlow({ initialData }: OnboardingFlowProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedStep = localStorage.getItem('onboardingStep');
      return savedStep ? parseInt(savedStep, 10) : 0;
    }
    return 0;
  });
  const [userData, setUserData] = useState<FormData>(() => ({
    artists: initialData.artists?.map(ua => ua.artist) || [],
    spotifyConnected: initialData.spotifyConnected || false,
    // Map the basic fields directly
    Age: initialData.age?.toString() || '',
    Gender: initialData.gender || '',
    Location: initialData.location || '',
    // Map enum values to their display values
    'Experience Level': initialData.experienceLevel ? [EXPERIENCE_LEVEL_MAP[initialData.experienceLevel]] : [],
    'Preferred Pace': initialData.preferredPace ? [PREFERRED_PACE_MAP[initialData.preferredPace]] : [],
    'Preferred Distance': initialData.preferredDistance ? [PREFERRED_DISTANCE_MAP[initialData.preferredDistance]] : [],
    interests: initialData.interests?.map(ui => ui.interest.id) || [],
    'Dog Friendly': initialData.dogFriendly || false,
    Transportation: initialData.transportation ? TRANSPORTATION_MAP[initialData.transportation] : ''
  }));
  const [isLoading, setIsLoading] = useState(true);
  console.log("userDataexp:", userData);
  useEffect(() => {
    localStorage.setItem('onboardingStep', currentStep.toString());
  }, [currentStep]);

  const handleUpdateProfile = async (profileData: ProfileWithArtistsAndInterests) => {
    try {
      const response = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...profileData,
          onboardingCompleted: true
        })
      });

      if (!response.ok) throw new Error('Failed to update profile');
      router.push('/dashboard');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to complete onboarding');
    }
  };


  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await fetch('/api/profile/me');
        if (response.ok) {
          const profile = await response.json();
          
          // Fetch artists separately
          const artistsResponse = await fetch('/api/profile/artists');
          if (artistsResponse.ok) {
            const artists = await artistsResponse.json();
            profile.artists = artists;
            profile.spotifyConnected = artists.length > 0;
          }

          // Don't store availableInterests in userData
          setUserData({
            ...profile,
            interests: profile.interests?.map((ui: any) => ui.interest.id) || [],
          });
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        toast.error('Failed to load profile data');
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, []);


  const steps = [
    {
      title: 'Connect to Spotify',
      subtitle: 'Link your Spotify account to personalize your experience with your favorite artists',
      options: []
    },
    {
      title: 'Tell us about yourself',
      subtitle: 'This helps us personalize your experience',
      options: [
        { 
          type: 'input' as const, 
          label: 'Age', 
          placeholder: 'Enter your age' 
        },
        { 
          type: 'select' as const, 
          label: 'Gender', 
          choices: ['Male', 'Female', 'Non-binary', 'Prefer not to say'] 
        },
        { 
          type: 'input' as const, 
          label: 'Location', 
          placeholder: 'Enter your city' 
        }
      ]
    },
    {
      title: 'Your hiking preferences',
      subtitle: 'Help us find the perfect hiking buddies for you',
      options: [
        {
          type: 'bubbles' as const,
          label: 'Experience Level',
          choices: [
            'Beginner (0-1)', 
            'Intermediate (1-2)', 
            'Advanced (2-3)', 
            'Expert (3)'
          ],
          maxSelect: 1
        },
        {
          type: 'bubbles' as const,
          label: 'Preferred Pace',
          choices: ['Leisurely', 'Moderate', 'Fast', 'Very Fast'],
          maxSelect: 1
        },
        {
          type: 'bubbles' as const,
          label: 'Preferred Distance',
          choices: ['1-5 km', '5-10 km', '10-20 km', '20+ km'],
          maxSelect: 2
        }
      ]
    },
    {
      title: 'Your Interests',
      subtitle: 'Select interests that match your personality',
      options: [
        {
          type: 'interests' as const,
          label: 'Interests',
          maxSelect: 5
        },
        {
          type: 'toggle' as const,
          label: 'Dog Friendly',
          description: 'Are you open to hiking with people who bring their dogs?'
        },
        {
          type: 'select' as const,
          label: 'Transportation',
          choices: ['Car', 'Public Transport', 'Both']
        }
      ]
    }
  ];

  const handleSelect = async (stepData: any) => {
    const transformedData = {
      ...userData,
      ...stepData,
      // Convert display values back to enum values
      experienceLevel: stepData.experienceLevel ? REVERSE_EXPERIENCE_LEVEL_MAP[stepData.experienceLevel] : userData.experienceLevel,
      preferredPace: stepData.preferredPace ? REVERSE_PREFERRED_PACE_MAP[stepData.preferredPace] : userData.preferredPace,
      preferredDistance: stepData.preferredDistance ? REVERSE_PREFERRED_DISTANCE_MAP[stepData.preferredDistance] : userData.preferredDistance,
      transportation: stepData.transportation ? REVERSE_TRANSPORTATION_MAP[stepData.transportation] : userData.transportation,
    };

    setUserData(transformedData);

    try {
      if (currentStep > 0) {
        await fetch('/api/profile/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(transformedData)
        });
      }

      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        await handleUpdateProfile(transformedData);
      }
    } catch (error) {
      console.error('Error saving progress:', error);
      toast.error('Failed to save progress');
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && !window.location.pathname.includes('onboarding')) {
        localStorage.removeItem('onboardingStep');
      }
    };
  }, []);

  console.log("initialData:", initialData);

  useEffect(() => {
    console.log('userData.interests changed:', userData.interests);
  }, [userData.interests]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <Progress
            value={(currentStep / (steps.length - 1)) * 100}
            className="mb-8"
          />

          {currentStep === 0 ? (
            <div>
              <h2 className="text-2xl font-bold mb-4">Connectttt to Spotify</h2>
              <p className="text-gray-600 mb-6">
                Link your Spotify account to personalize your experience with your favorite artists
              </p>
              {isLoading ? (
                <SpotifyArtistsDisplaySkeleton />
              ) : (
                <SpotifyArtistsDisplay
                  isConnected={initialData?.spotifyConnected || false}
                  isEditable={false}
                  profile={initialData}
                
                />
              )}
              <div className="mt-6 flex justify-end">
                <Button onClick={() => setCurrentStep(1)}>Next</Button>
              </div>
            </div>
          ) : (
            <OnboardingStep
              stepData={steps[currentStep]}
              onSelect={handleSelect}
              onBack={handleBack}
              isLastStep={currentStep === steps.length - 1}
              currentStep={currentStep}
              initialValues={userData}
              loading={isLoading}
            />
          )}
        </div>
      </div>
    </div>
  );
}