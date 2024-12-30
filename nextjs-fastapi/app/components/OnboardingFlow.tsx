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

// Use Prisma's utility types for Artist with relations
type ArtistWithRelations = Prisma.ArtistGetPayload<{
  include: {
    genres: true;
    profiles: true;
  }
}>;

interface OnboardingFlowProps {
  initialData?: any;
}

interface FormData {
  artists: ArtistWithRelations[];
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


export default function OnboardingFlow({ initialData }: OnboardingFlowProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedStep = localStorage.getItem('onboardingStep');
      return savedStep ? parseInt(savedStep, 10) : 0;
    }
    return 0;
  });
  const [userData, setUserData] = useState<FormData>({
    artists: [],
    spotifyConnected: false,
    age: '',
    gender: '',
    location: '',
    experienceLevel: '',
    preferredPace: '',
    preferredDistance: '',
    interests: [],
    dogFriendly: false,
    transportation: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  console.log("userData:", userData);
  useEffect(() => {
    localStorage.setItem('onboardingStep', currentStep.toString());
  }, [currentStep]);

  const handleUpdateProfile = async (formData: any) => {
    try {
      const { availableInterests, ...profileData } = formData; // Remove availableInterests from data sent to API
      console.log("profileData:", profileData);
      const response = await fetch('/api/profile/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...profileData,
          interests: formData.interests || [],
          onboardingCompleted: true
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      router.push('/dashboard');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to complete onboarding');
    }
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

  useEffect(() => {
    const checkAndFetchArtists = async () => {
      console.log("Checking and fetching artists");
      try {
        // Get the current profile
        const profileResponse = await fetch('/api/profile/me');
        const profile = await profileResponse.json();
        // if request files get now token with refreshtoken TODO!
        if (profile.spotifyConnected && profile.spotifyAccessToken) {
          // Fetch artists from Spotify
          const response = await fetch('https://api.spotify.com/v1/me/top/artists?limit=3', {
            headers: {
              'Authorization': `Bearer ${profile.spotifyAccessToken}`
            }
          });
          console.log("Response:", response);

          if (!response.ok) {
            throw new Error('Failed to fetch artists from Spotify');
          }

          const data = await response.json();

          // Transform artists to the correct format
          const formattedArtists = data.items.map((artist: any) => ({
            spotifyId: artist.id,
            name: artist.name,
            imageUrl: artist.images[0]?.url,
            genres: artist.genres,
            hidden: false
          }));  

          setUserData(prev => ({
            ...prev,
            artists: formattedArtists
          }));
        }
      } catch (error) {
        console.error('Error fetching artists:', error);
      }
    };

    checkAndFetchArtists();
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
    const newUserData = { ...userData, ...stepData };
    setUserData(newUserData);
    console.log("newUserData isConnected:", newUserData);

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
        await handleUpdateProfile(newUserData);
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
                  user={initialData?.id || { id: '' }}
                
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