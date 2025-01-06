import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PreferencesStepProps {
  formData: Record<string, any>;
  errors: Record<string, string>;
  onChange: (field: string, value: any) => void;
}

export function PreferencesStep({ formData, errors, onChange }: PreferencesStepProps) {
  const handleBubbleSelect = (field: string, value: string) => {
    const currentValues = Array.isArray(formData[field]) ? formData[field] : [];
    const maxSelect = 1; // For these preferences, we only want one selection

    if (currentValues.includes(value)) {
      onChange(field, currentValues.filter((v: string) => v !== value));
    } else {
      onChange(field, [value]); // Replace existing value
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <Label>Experience Level</Label>
        <div className="flex flex-wrap gap-2">
          {['Beginner', 'Intermediate', 'Advanced', 'Expert'].map((level) => (
            <Button
              key={level}
              type="button"
              variant={formData.experienceLevel?.includes(level) ? "outline" : "default"}
              onClick={() => handleBubbleSelect('experienceLevel', level)}
              className={cn(
                "rounded-full transition-colors",
                errors.experienceLevel && "border-red-500"
              )}
            >
              {level}
            </Button>
          ))}
        </div>
        {errors.experienceLevel && (
          <p className="text-sm text-red-500 mt-1">{errors.experienceLevel}</p>
        )}
      </div>

      <div className="space-y-4">
        <Label>Preferred Pace</Label>
        <div className="flex flex-wrap gap-2">
          {['Leisurely', 'Moderate', 'Fast', 'Very Fast'].map((pace) => (
            <Button
              key={pace}
              variant={formData.preferredPace?.includes(pace) ? "outline" : "default"}
              onClick={() => handleBubbleSelect('preferredPace', pace)}
              className={cn(
                "rounded-full",
                errors.preferredPace && "border-red-500"
              )}
            >
              {pace}
            </Button>
          ))}
        </div>
        {errors.preferredPace && (
          <p className="text-sm text-red-500">{errors.preferredPace}</p>
        )}
      </div>

      <div className="space-y-4">
        <Label>Preferred Distance</Label>
        <div className="flex flex-wrap gap-2">
          {['1-5 km', '5-10 km', '10-20 km', '20+ km'].map((distance) => (
            <Button
              key={distance}
              variant={formData.preferredDistance?.includes(distance) ? "outline" : "default"}
              onClick={() => handleBubbleSelect('preferredDistance', distance)}
              className={cn(
                "rounded-full",
                errors.preferredDistance && "border-red-500"
              )}
            >
              {distance}
            </Button>
          ))}
        </div>
        {errors.preferredDistance && (
          <p className="text-sm text-red-500">{errors.preferredDistance}</p>
        )}
      </div>
    </div>
  );
} 