import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import InterestOption from '../StepOptions/InterestsOption';
import { useState, useEffect } from 'react';
import { Interest } from '@prisma/client';
import { cn } from "@/lib/utils";

interface InterestsStepProps {
  formData: Record<string, any>;
  errors: Record<string, string>;
  onChange: (field: string, value: any) => void;
}

export function InterestsStep({ formData, errors, onChange }: InterestsStepProps) {
  const [availableInterests, setAvailableInterests] = useState<Interest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInterests = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/apinextjs/interests');
        if (response.ok) {
          const interests = await response.json();
          setAvailableInterests(interests);
        }
      } catch (error) {
        console.error('Error fetching interests:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInterests();
  }, []);

  if (isLoading) {
    return <div>Loading interests...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <InterestOption
          availableInterests={availableInterests}
          formData={formData}
          onInterestSelect={(interestId) => {
            const currentInterests = Array.isArray(formData.interests) ? formData.interests : [];
            const maxSelect = 5;

            if (currentInterests.includes(interestId)) {
              onChange('interests', currentInterests.filter((id: string) => id !== interestId));
            } else if (currentInterests.length < maxSelect) {
              onChange('interests', [...currentInterests, interestId]);
            }
          }}
          maxSelect={5}
        />
        {errors.interests && (
          <p className="text-sm text-red-500 mt-1">{errors.interests}</p>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base">Dog Friendly</Label>
            <p className="text-sm text-gray-500">
              Are you open to hiking with people who bring their dogs?
            </p>
          </div>
          <Switch
            checked={formData.dogFriendly}
            onCheckedChange={(checked) => onChange('dogFriendly', checked)}
          />
        </div>
      </div>

    </div>
  );
} 