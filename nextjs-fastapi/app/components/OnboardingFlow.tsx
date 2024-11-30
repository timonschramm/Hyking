import { useState } from 'react';
import OnboardingStep from './OnboardingStep';
import { Progress } from "@/components/ui/progress";
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";

const OnboardingFlow = () => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [userData, setUserData] = useState({});

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
        { type: 'input' as const, label: 'Age', placeholder: 'Enter your age' },
        { type: 'select' as const, label: 'Gender', choices: ['Male', 'Female', 'Non-binary', 'Prefer not to say'] },
        { type: 'input' as const, label: 'Location', placeholder: 'Enter your city' }
      ]
    },
   
    {
      title: 'Your hiking preferences',
      subtitle: 'Help us find the perfect hiking buddies for you',
      options: [
        {
          type: 'bubbles' as const,
          label: 'Experience Level',
          choices: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
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

  const handleComplete = async () => {
    try {
      // Mock API call
      await fetch('/api/py/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      router.push('/dashboard');
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  };

  const handleSelect = (stepData: any) => {
    setUserData((prev) => ({ ...prev, ...stepData }));

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="min-h-screen bg-base-200 flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-base-100 rounded-2xl shadow-xl p-8">
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
        />
      </div>
    </div>
  );
};

export default OnboardingFlow; 