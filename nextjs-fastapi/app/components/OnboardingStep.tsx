import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from 'sonner';
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { InterestCategory, Interest } from '@prisma/client';
import InterestOption from './OnboardingStep/StepOptions/InterestsOption';


interface StepOption {
  type: 'select' | 'input' | 'bubbles' | 'toggle' | 'interests';
  label: string;
  choices?: string[];
  maxSelect?: number;
  placeholder?: string;
  description?: string;
}

interface StepData {
  title: string;
  subtitle: string;
  options: StepOption[];
}

interface OnboardingStepProps {
  stepData: StepData;
  onSelect: (stepData: any) => void;
  isLastStep: boolean;
  onBack: () => void;
  currentStep: number;
  validation?: (value: any) => boolean;
  initialValues?: Record<string, any>;
  loading?: boolean;
}

const InputStepSkeleton = () => (
  <div className="space-y-6">
    <div className="space-y-2">
      <Skeleton className="h-8 w-64" /> {/* Title */}
      <Skeleton className="h-5 w-full" /> {/* Subtitle */}
    </div>
    
    {/* Input fields */}
    {[1, 2, 3].map((i) => (
      <div key={i} className="space-y-2">
        <Skeleton className="h-5 w-20" /> {/* Label */}
        <Skeleton className="h-10 w-full rounded-md" /> {/* Input */}
      </div>
    ))}

    {/* Navigation */}
    <div className="flex justify-between pt-4">
      <Skeleton className="h-10 w-32" />
      <Skeleton className="h-10 w-32" />
    </div>
  </div>
);

const BubblesStepSkeleton = () => (
  <div className="space-y-6">
    <div className="space-y-2">
      <Skeleton className="h-8 w-64" /> {/* Title */}
      <Skeleton className="h-5 w-full" /> {/* Subtitle */}
    </div>

    {/* Bubble options */}
    {[1, 2].map((group) => (
      <div key={group} className="space-y-2">
        <Skeleton className="h-5 w-32" /> {/* Label */}
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-10 w-24 rounded-full" />
          ))}
        </div>
      </div>
    ))}

    {/* Navigation */}
    <div className="flex justify-between pt-4">
      <Skeleton className="h-10 w-32" />
      <Skeleton className="h-10 w-32" />
    </div>
  </div>
);

const ToggleStepSkeleton = () => (
  <div className="space-y-6">
    <div className="space-y-2">
      <Skeleton className="h-8 w-64" /> {/* Title */}
      <Skeleton className="h-5 w-full" /> {/* Subtitle */}
    </div>

    {/* Toggle options */}
    {[1, 2].map((i) => (
      <div key={i} className="flex items-center justify-between py-2">
        <div className="space-y-1">
          <Skeleton className="h-5 w-32" /> {/* Label */}
          <Skeleton className="h-4 w-48" /> {/* Description */}
        </div>
        <Skeleton className="h-6 w-11 rounded-full" /> {/* Toggle */}
      </div>
    ))}

    {/* Navigation */}
    <div className="flex justify-between pt-4">
      <Skeleton className="h-10 w-32" />
      <Skeleton className="h-10 w-32" />
    </div>
  </div>
);

// Add these styles to improve the select and button appearances
const selectStyles = {
  trigger: "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary-medium focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  content: "min-w-[8rem] overflow-hidden rounded-md border border-primary-medium bg-background p-1 text-foreground shadow-md",
  item: "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-primary-light focus:text-primary data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
};

const bubbleButtonStyles = {
  default: "bg-primary text-white hover:bg-primary-medium",
  selected: "bg-primary-light text-primary hover:bg-primary-light/90",
  outline: "border-2 border-primary text-primary hover:bg-primary-light/10",
};

const OnboardingStep: React.FC<OnboardingStepProps> = ({ 
  stepData, 
  onSelect, 
  isLastStep, 
  onBack, 
  validation,
  currentStep,
  initialValues,
  loading = false 
}) => {
  const [formData, setFormData] = useState<Record<string, any>>(initialValues || {});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [availableInterests, setAvailableInterests] = useState<Interest[]>([]);

  useEffect(() => {
    const fetchInterests = async () => {
      try {
        const response = await fetch('/apinextjs/interests');
        if (response.ok) {
          const interests = await response.json();
        // console.log('API Response:', interests);
        // console.log('Response type:', typeof interests);
        // console.log('Is Array?', Array.isArray(interests));
          setAvailableInterests(interests);
        }
      } catch (error) {
        console.error('Error fetching interests:', error);
      }
    };

    if (stepData.options.some(opt => opt.type === 'interests')) {
      fetchInterests();
    }
  }, [stepData.options]);

  useEffect(() => {
    if (initialValues) {
      setFormData(prev => {
        // Only update interests if initialValues.interests exists and is non-empty
        const newInterests = initialValues.interests?.length 
          ? initialValues.interests 
          : prev.interests || [];

        return {
          ...prev,
          ...initialValues,
          interests: newInterests
        };
      });
    }
  }, [initialValues]);

  const handleInputChange = (label: string, value: any) => {
    setFormData(prev => ({ ...prev, [label]: value }));
  };

  const handleBubbleSelect = (label: string, value: string) => {
    setFormData(prev => {
      const currentValues = prev[label] || [];
      const maxSelect = stepData.options.find(opt => opt.label === label)?.maxSelect || 1;
      
      if (currentValues.includes(value)) {
        return {
          ...prev,
          [label]: currentValues.filter((v: string) => v !== value)
        };
      } else {
        const newValues = [...currentValues, value].slice(-maxSelect);
        return {
          ...prev,
          [label]: newValues
        };
      }
    });
  };

  const handleInterestSelect = (interestId: string) => {
    setFormData(prev => {
      const currentInterests = prev.interests || [];
      const maxSelect = stepData.options.find(opt => opt.label === 'Interests')?.maxSelect || 5;
    // console.log('currentInterests:', currentInterests);
      if (currentInterests.includes(interestId)) {
        // Fix: Create new array to ensure state update
        const newInterests = currentInterests.filter((id: string) => id !== interestId);
        return {
          ...prev,
          interests: newInterests
        };
      } else if (currentInterests.length < maxSelect) {
        // Fix: Create new array to ensure state update
        const newInterests = [...currentInterests, interestId];
      // console.log("newInterests:", newInterests)
        return {
          ...prev,
          interests: newInterests
        };
      }
      
      return prev;
    });
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    stepData.options.forEach(option => {
      const value = formData[option.label];
      
      // if (option.validation && !option.validation(value)) {
      //   newErrors[option.label] = `Please select a valid ${option.label.toLowerCase()}`;
      // }
      
      if (option.label === 'Age') {
        const age = parseInt(value);
        if (isNaN(age) || age < 13 || age > 120) {
          newErrors['Age'] = 'Please enter a valid age between 13 and 120';
        }
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  if (loading) {
    const firstOptionType = stepData.options[0]?.type;
    switch (firstOptionType) {
      case 'input': return <InputStepSkeleton />;
      case 'bubbles': return <BubblesStepSkeleton />;
      case 'toggle': return <ToggleStepSkeleton />;
      default: return <InputStepSkeleton />;
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">{stepData.title}</h2>
        <p className="text-muted-foreground">{stepData.subtitle}</p>
      </div>

      <div className="space-y-6">
        {stepData.options.map((option) => (
          <div key={option.label} className="space-y-2">
            {option.type === 'select' && (
              <Select
                value={formData[option.label] || ''}
                onValueChange={(value) => handleInputChange(option.label, value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={option.placeholder || `Select ${option.label}`} />
                </SelectTrigger>
                <SelectContent>
                  {option.choices?.map((choice) => (
                    <SelectItem key={choice} value={choice}>
                      {choice}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {option.type === 'input' && option.label !== 'Add Hobby' && (
              <div>
                <Label>{option.label}</Label>
                <Input
                  type="text"
                  placeholder={option.placeholder}
                  value={formData[option.label] || ''}
                  onChange={(e) => handleInputChange(option.label, e.target.value)}
                />
                {errors[option.label] && (
                  <p className="text-red-500 text-sm mt-1">{errors[option.label]}</p>
                )}
              </div>
            )}

            {option.type === 'bubbles' && (
              <div className="flex flex-wrap gap-2">
                {option.choices?.map((choice) => {
                  const currentValues = formData[option.label] || [];
                  const isSelected = currentValues.includes(choice);
                  return (
                    <Button
                      key={choice}
                      variant={isSelected ? "default" : "outline"}
                      onClick={() => 
                        option.label === 'Interests' 
                          ? handleInterestSelect(choice)
                          : handleBubbleSelect(option.label, choice)
                      }
                      className={cn(
                        "rounded-full transition-colors duration-200",
                        isSelected ? bubbleButtonStyles.selected : bubbleButtonStyles.outline
                      )}
                    >
                      {choice}
                    </Button>
                  );
                })}
              </div>
            )}

            {option.type === 'toggle' && (
              <div className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary-cream transition-colors duration-200">
                <div className="space-y-0.5">
                  <Label className="text-primary font-medium">{option.label}</Label>
                  <p className="text-sm text-primary-medium">
                    {option.description}
                  </p>
                </div>
                <Switch
                  checked={formData[option.label] || false}
                  onCheckedChange={(checked) => handleInputChange(option.label, checked)}
                  className="data-[state=checked]:bg-primary-light"
                />
              </div>
            )}

            {option.type === 'interests' && (
              <InterestOption
                availableInterests={availableInterests}
                formData={formData}
                onInterestSelect={handleInterestSelect}
                maxSelect={option.maxSelect}
              />
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-between pt-4">
        <Button 
          onClick={onBack}
          className="w-32 bg-secondary-cream text-primary hover:bg-secondary-sage"
          disabled={currentStep === 0}
        >
          Back
        </Button>
        <Button 
          onClick={() => onSelect(formData)}
          className="w-32 bg-primary text-white hover:bg-primary-medium"
        >
          {isLastStep ? 'Complete' : 'Next'}
        </Button>
      </div>
    </div>
  );
};

export default OnboardingStep; 