import { useState, useEffect } from 'react';
import { Progress } from "@/components/ui/progress";
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';
import SpotifyArtistsDisplay from './SpotifyArtistsDisplay';
import { BasicInformationStep } from './OnboardingStep/Steps/BasicInformationStep';
import PreferencesStep from './OnboardingStep/Steps/PreferencesStep';
import { InterestsStep } from './OnboardingStep/Steps/InterestsStep';
import { ProfileWithArtistsAndInterestsAndSkills } from '@/types/profiles';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ProfilePhotoOption from './OnboardingStep/StepOptions/ProfilePhotoOption';

// Type-s

interface OnboardingFlowProps {
  initialData: ProfileWithArtistsAndInterestsAndSkills;
}

// First, define an interface for the step structure
interface OnboardingStep {
  id: 'spotify' | 'basics' | 'preferences' | 'interests' | 'photo';
  title: string;
  subtitle: string;
  validate: () => boolean;
}

export default function OnboardingFlow({ initialData }: OnboardingFlowProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState(() => ({
    imageFile: null,
    imageUrl: initialData.imageUrl || null,
    email: initialData.email || '',
    artists: initialData.artists || [],
    spotifyConnected: initialData.spotifyConnected || false,
    age: initialData.age?.toString() || '',
    gender: initialData.gender || '',
    location: initialData.location || '',
    interests: initialData.interests?.map(ui => ui.interest.id) || [],
    dogFriendly: initialData.dogFriendly || false,
    skills: initialData.skills || []
  }));
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Define steps with proper syntax
  const steps: OnboardingStep[] = [
    {
      id: 'spotify',
      title: 'Connect Your Music',
      subtitle: 'Lets find hiking buddies who share your music taste',
      validate: function() { return true; }
    } as const,
    {
      id: 'photo',
      title: 'Profile Photo',
      subtitle: 'Add a photo to help others recognize you',
      validate: function() { return true; }
    } as const,
    {
      id: 'basics',
      title: 'Basic Information',
      subtitle: 'Tell us a bit about yourself',
      validate: function() {
        const newErrors: Record<string, string> = {};
        if (!formData.age) newErrors.age = 'Age is required';
        if (!formData.gender) newErrors.gender = 'Gender is required';
        if (!formData.location) newErrors.location = 'Location is required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
      }
    } as const,
    {
      id: 'preferences',
      title: 'Hiking Preferences',
      subtitle: 'Help us match you with compatible hiking partners',
      validate: function() {
        const newErrors: Record<string, string> = {};
        if (!formData.skills?.length) {
          newErrors.skills = 'Please select all preferences';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
      }
    } as const,
    {
      id: 'interests',
      title: 'Your Interests',
      subtitle: 'Select interests that match your personality',
      validate: function() {
        const newErrors: Record<string, string> = {};
        if (!formData.interests?.length) newErrors.interests = 'Please select at least one interest';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
      }
    } as const
  ];

  // Handle form updates
  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear any errors for this field
    if (errors[field]) {
      setErrors(prev => {
        const { [field]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  // Handle step navigation
  const handleNext = async () => {
    const currentStepData = steps[currentStep];
    
    if (!currentStepData.validate()) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (currentStep === steps.length - 1) {
      await handleComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  // Handle form completion
  const handleComplete = async () => {
    setIsLoading(true);
    const spotifyConnected = formData.artists.length > 0;
    try {
      // Create FormData instance for multipart/form-data
      const submitFormData = new FormData();
      
      // Add the image if one was selected
      if (formData.imageFile) {
        submitFormData.append('image', formData.imageFile);
      }

      // Transform and add the rest of the data
      const transformedData = {
        age: parseInt(formData.age),
        gender: formData.gender,
        location: formData.location,
        dogFriendly: formData.dogFriendly,
        interests: formData.interests,
        onboardingCompleted: true,
        artists: formData.artists,
        spotifyConnected: spotifyConnected,
        skills: formData.skills
      };

      submitFormData.append('data', JSON.stringify(transformedData));

      const response = await fetch('/apinextjs/profile/update', {
        method: 'POST',
        body: submitFormData,
      });

      if (!response.ok) throw new Error('Failed to update profile');
      
      toast.success('Profile updated successfully!');
      router.push('/dashboard/groupmatches');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to complete onboarding');
    } finally {
      setIsLoading(false);
    }
  };

  // Render step content
  const renderStepContent = () => {
    switch (steps[currentStep].id) {
      case 'photo':
        return (
          <ProfilePhotoOption
            formData={{
              imageFile: formData.imageFile,
              imageUrl: formData.imageUrl,
              email: formData.email,
            }}
            onPhotoSelect={(file) => updateFormData('imageFile', file)}
          />
        );
      case 'spotify':
        return (
          <div className="space-y-6">
            <SpotifyArtistsDisplay
              isConnected={formData.spotifyConnected}
              isEditable={false}
              profile={initialData}
            />
          </div>
        );

      case 'basics':
        return (
          <BasicInformationStep
            formData={formData}
            errors={errors}
            onChange={updateFormData}
          />
        );

      case 'preferences':
        return (
          <PreferencesStep
            onNext={handleNext}
            onBack={handleBack}
            initialData={formData}
            onDataChange={(data) => updateFormData('skills', data.skills)}
          />
        );

      case 'interests':
        return (
          <InterestsStep
            formData={formData}
            errors={errors}
            onChange={updateFormData}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <Progress
            value={(currentStep / (steps.length - 1)) * 100}
            className="mb-8"
          />

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="space-y-6">
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold tracking-tight">
                    {steps[currentStep].title}
                  </h2>
                  <p className="text-muted-foreground">
                    {steps[currentStep].subtitle}
                  </p>
                </div>

                {renderStepContent()}

                <div className="flex justify-between pt-4">
                  <Button
                    onClick={handleBack}
                    disabled={currentStep === 0 || isLoading}
                    variant="outline"
                    className="w-32"
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>

                  <Button
                    onClick={handleNext}
                    disabled={isLoading}
                    className="w-32"
                  >
                    {currentStep === steps.length - 1 ? (
                      'Complete'
                    ) : (
                      <>
                        Next
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}