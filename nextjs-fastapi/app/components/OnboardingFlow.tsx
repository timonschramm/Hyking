import { useState, useEffect } from 'react';
import OnboardingStep from './OnboardingStep';
import { Progress } from "@/components/ui/progress";
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';
import { UserProfileData } from '@/types/UserData';

interface OnboardingFlowProps {
  initialData?: any;
}

interface FormData {
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

export default function OnboardingFlow({ initialData }: OnboardingFlowProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [userData, setUserData] = useState<FormData>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await fetch('/api/profile/me');
        console.log('response');
        console.log(response.body);
        if (response.ok) {
          const profile = await response.json();
          console.log('Setting user data:', profile);
          setUserData({
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
        } else {
          throw new Error(`Failed to load profile: ${response.statusText}`);
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
      options: [] // No options needed, handled directly in OnboardingStep
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
        router.push('/dashboard');
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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {isLoading ? (
        <div className="text-center">Loading...</div>
      ) : (
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <Progress
              value={(currentStep / (steps.length - 1)) * 100}
              className="mb-8"
            />

            <OnboardingStep
              key={currentStep}
              stepData={steps[currentStep]}
              onSelect={handleSelect}
              onBack={handleBack}
              isLastStep={currentStep === steps.length - 1}
              currentStep={currentStep}
              initialValues={userData}
            />

           
          </div>
        </div>
      )}
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