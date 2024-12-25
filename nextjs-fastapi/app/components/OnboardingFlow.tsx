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

interface OnboardingFlowProps {
  initialData?: any;
}

// Add Spotify-related types
interface SpotifyData {
  artists?: Array<{
    spotifyId: string;
    name: string;
    imageUrl: string;
    genres: { name: string }[];
    hidden: boolean;
  }>;
  spotifyConnected?: boolean;
}

interface FormData extends SpotifyData {
  'Age'?: string;
  'Gender'?: string;
  'Location'?: string;
  'Experience Level'?: string;
  'Preferred Pace'?: string;
  'Preferred Distance'?: string;
  'Hobbies'?: string[];
  'Dog Friendly'?: boolean;
  'Transportation'?: string;
}

// Add this new component for the loading state
const OnboardingFlowSkeleton = () => {
  return (
    <div className="space-y-6">
      {/* Title and subtitle skeletons matching exact structure */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" /> {/* Title - matches text-2xl font-bold */}
        <Skeleton className="h-5 w-full" /> {/* Subtitle - matches actual text size */}
      </div>

      {/* For Spotify step - matching SpotifyArtistsDisplay structure */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center space-x-3">
              <Skeleton className="w-12 h-12 rounded-full" /> {/* Artist image */}
              <div className="space-y-2">
                <Skeleton className="h-5 w-24" /> {/* Artist name */}
                <Skeleton className="h-4 w-32" /> {/* Genres */}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Button skeleton */}
      <div className="mt-6 flex justify-end">
        <Skeleton className="h-10 w-24" /> {/* Next button */}
      </div>
    </div>
  );
};

export default function OnboardingFlow({ initialData }: OnboardingFlowProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedStep = localStorage.getItem('onboardingStep');
      return savedStep ? parseInt(savedStep, 10) : 0;
    }
    return 0;
  });
  const [userData, setUserData] = useState<FormData>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    localStorage.setItem('onboardingStep', currentStep.toString());
  }, [currentStep]);

  const completeOnboarding = () => {
    localStorage.removeItem('onboardingStep');
    router.push('/dashboard');
  };

  // Add handleSpotifyConnect function
  const handleSpotifyConnect = async () => {
    try {
      const response = await fetch('/api/connectToSpotify?from=onboarding');
      const data = await response.json();
      window.location.href = data.url;
    } catch (error) {
      console.error('Error connecting to Spotify:', error);
      toast.error('Failed to connect to Spotify');
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

          setUserData({
            artists: profile.artists,
            spotifyConnected: profile.spotifyConnected,
            'Age': profile.age?.toString(),
            'Gender': profile.gender,
            'Location': profile.location,
            'Experience Level': profile.experienceLevel !== undefined ? convertExperienceLevelBack(profile.experienceLevel) : undefined,
            'Preferred Pace': profile.preferredPace !== undefined ? convertPreferredPaceBack(profile.preferredPace) : undefined,
            'Preferred Distance': profile.preferredDistance !== undefined ? convertPreferredDistanceBack(profile.preferredDistance) : undefined,
            'Hobbies': profile.hobbies || [],
            'Dog Friendly': profile.dogFriendly,
            'Transportation': profile.transportation !== undefined ? convertTransportationBack(profile.transportation) : undefined,
          });
        } else if (response.status === 404) {
          console.log('No existing profile found, starting fresh');
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
          maxSelect: 1,
          validation: (value: string) => {
            return value !== undefined && value !== null;
          }
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
      title: 'Additional preferences',
      subtitle: 'Almost there! Just a few more details',
      options: [
        {
          type: 'bubbles' as const,
          label: 'Hobbies',
          choices: ['Photography', 'Bird Watching', 'Rock Climbing', 'Camping', 'Nature Study', 'Wildlife Spotting'],
          maxSelect: 4
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
    const newUserData = { ...userData, ...stepData };
    setUserData(newUserData);

    try {
      if (currentStep > 0) {
        const response = await fetch('/api/profile/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newUserData),
        });

        if (!response.ok) {
          throw new Error('Failed to save progress');
        }
      }

      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        completeOnboarding();
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
              <h2 className="text-2xl font-bold mb-4">Connect to Spotify</h2>
              <p className="text-gray-600 mb-6">
                Link your Spotify account to personalize your experience with your favorite artists
              </p>
              {isLoading ? (
                <SpotifyArtistsDisplaySkeleton />
              ) : (
                <SpotifyArtistsDisplay
                  artists={userData.artists}
                  isConnected={userData.spotifyConnected || false}
                  isEditable={true}
                  onArtistsChange={(artists) => {
                    setUserData(prev => ({
                      ...prev,
                      artists: artists.map(artist => ({
                        ...artist,
                        genres: artist.genres.map(genre => 
                          typeof genre === 'string' ? { name: genre } : genre
                        )
                      }))
                    }));
                  }}
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

function convertExperienceLevelBack(level: number): string {
  const mapping = {
    0: 'Beginner (0-1)',
    1: 'Intermediate (1-2)',
    2: 'Advanced (2-3)',
    3: 'Expert (3)'
  };
  return mapping[level as keyof typeof mapping];
}

function convertPreferredPaceBack(pace: number): string {
  const mapping = {
    0: 'Leisurely',
    1: 'Moderate',
    2: 'Fast',
    3: 'Very Fast'
  };
  return mapping[pace as keyof typeof mapping];
}

function convertPreferredDistanceBack(distance: number): string {
  const mapping = {
    0: '1-5 km',
    1: '5-10 km',
    2: '10-20 km',
    3: '20+ km'
  };
  return mapping[distance as keyof typeof mapping];
}

function convertTransportationBack(transportation: number): string {
  const mapping = {
    0: 'Car',
    1: 'Public Transport',
    2: 'Both'
  };
  return mapping[transportation as keyof typeof mapping];
} 