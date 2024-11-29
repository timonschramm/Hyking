import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface StepOption {
  type: 'select' | 'input' | 'bubbles' | 'toggle';
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
}

const OnboardingStep: React.FC<OnboardingStepProps> = ({ stepData, onSelect, isLastStep, onBack, currentStep }) => {
  const [formData, setFormData] = useState<Record<string, any>>({});

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

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">{stepData.title}</h2>
        <p className="text-muted-foreground">{stepData.subtitle}</p>
      </div>

      <div className="space-y-6">
        {stepData.options.map((option, idx) => (
          <div key={idx} className="space-y-2">
            <Label>{option.label}</Label>
            
            {option.type === 'select' && (
              <Select
                onValueChange={(value) => handleInputChange(option.label, value)}
                value={formData[option.label]}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an option" />
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

            {option.type === 'input' && (
              <Input
                placeholder={option.placeholder}
                value={formData[option.label] || ''}
                onChange={(e) => handleInputChange(option.label, e.target.value)}
              />
            )}

            {option.type === 'bubbles' && (
              <div className="flex flex-wrap gap-2">
                {option.choices?.map((choice) => (
                  <Button
                    key={choice}
                    variant={formData[option.label]?.includes(choice) ? "default" : "outline"}
                    onClick={() => handleBubbleSelect(option.label, choice)}
                    className="rounded-full"
                  >
                    {choice}
                  </Button>
                ))}
              </div>
            )}

            {option.type === 'toggle' && (
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{option.label}</Label>
                  <p className="text-sm text-muted-foreground">
                    {option.description}
                  </p>
                </div>
                <Switch
                  checked={formData[option.label] || false}
                  onCheckedChange={(checked) => handleInputChange(option.label, checked)}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-between pt-4">
        <Button 
          onClick={onBack}
          className="w-32"
          disabled={currentStep === 0}
        >
          Back
        </Button>
        <Button 
          onClick={() => onSelect(formData)}
          className="w-32"
        >
          {isLastStep ? 'Complete' : 'Next'}
        </Button>
      </div>
    </div>
  );
};

export default OnboardingStep; 