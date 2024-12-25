import { useState, useEffect } from 'react';
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
import { prisma } from '@/lib/prisma';
import { toast } from 'sonner';
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface StepOption {
  type: 'select' | 'input' | 'bubbles' | 'toggle';
  label: string;
  choices?: string[];
  maxSelect?: number;
  placeholder?: string;
  description?: string;
  validation?: (value: any) => boolean;
}

interface StepData {
  title: string;
  subtitle: string;
  options: StepOption[];
}

interface Artist {
  id: string;
  name: string;
  images: { url: string }[];
  genres: string[];
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
  currentStep, 
  validation, 
  initialValues,
  loading = false 
}) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [topArtists, setTopArtists] = useState<Artist[]>([]);
  const [spotifyConnected, setSpotifyConnected] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialValues) {
      console.log('Received initial values:', initialValues);
      setFormData(initialValues);
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

  const connectToSpotify = async () => {
    try {
      const response = await fetch('/api/connectToSpotify');
      const data = await response.json();
      window.location.href = data.url;
    } catch (error) {
      console.error('Error connecting to Spotify:', error);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('spotify_token');
    if (token) {
      setSpotifyConnected(true);
      fetchTopArtists(token);
    }
  }, []);

  const fetchTopArtists = async (token: string) => {
    try {
      const response = await fetch('https://api.spotify.com/v1/me/top/artists?limit=3', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log(response);
      // console.log(response.json());
      const data = await response.json();
      console.log(data);
      setTopArtists(data.items);
    } catch (error) {
      console.error('Error fetching top artists:', error);
    }
  };
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    stepData.options.forEach(option => {
      const value = formData[option.label];
      
      if (option.validation && !option.validation(value)) {
        newErrors[option.label] = `Please select a valid ${option.label.toLowerCase()}`;
      }
      
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

  const handleAddHobby = (value: string) => {
    setFormData(prev => {
      const currentHobbies = prev['Hobbies'] || [];
      if (!currentHobbies.includes(value) && value.trim() !== '') {
        return {
          ...prev,
          'Hobbies': [...currentHobbies, value]
        };
      }
      return prev;
    });
  };

  const handleUploadArtists = async () => {
    if (!topArtists || topArtists.length === 0) {
      console.error('No artists to upload');
      toast.error('No artists available to upload');
      return;
    }

    try {
      // Transform artists to match the expected format
      const formattedArtists = topArtists.map(artist => ({
        spotifyId: artist.id, // Make sure this exists in your Artist interface
        name: artist.name,
        imageUrl: artist.images[0]?.url || '',
        genres: artist.genres || [],
        hidden: false
      }));

      console.log('Uploading artists:', formattedArtists);
      
      const response = await fetch('/api/profile/artists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ artists: formattedArtists }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to upload artists: ${errorText}`);
      }

      const result = await response.json();
      console.log('Artists uploaded successfully:', result);
      toast.success('Artists uploaded successfully!');
    } catch (error) {
      console.error('Error uploading artists:', error);
      toast.error('Failed to upload artists');
    }
  };

  if (loading) {
    // Choose skeleton based on the first option type in stepData
    const firstOptionType = stepData.options[0]?.type;
    switch (firstOptionType) {
      case 'input':
        return <InputStepSkeleton />;
      case 'bubbles':
        return <BubblesStepSkeleton />;
      case 'toggle':
        return <ToggleStepSkeleton />;
      default:
        return <InputStepSkeleton />;
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">{stepData.title}</h2>
        <p className="text-muted-foreground">{stepData.subtitle}</p>
      </div>

      <div className="space-y-6">
        {currentStep === 0 ? ( // Spotify step
          <div className="mt-4">
            {!spotifyConnected ? (
              <Button
                onClick={connectToSpotify}
                className="w-full bg-[#1DB954] hover:bg-[#1ed760] text-white"
              >
                Connect to Spotify
              </Button>
            ) : (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">Your Top Artists</h3>
                <div className="grid grid-cols-2 gap-4">
                  {topArtists?.map((artist) => (
                    <div key={artist.name} className="flex items-center space-x-3">
                      <img 
                        src={artist.images[0]?.url} 
                        alt={artist.name}
                        className="w-12 h-12 rounded-full"
                      />
                      <div>
                        <p className="font-medium">{artist.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {artist.genres.slice(0, 2).join(', ')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          stepData.options.map((option, idx) => (
            <div key={idx} className="space-y-2">
              <Label>{option.label}</Label>
              
              {option.type === 'select' && (
                <Select
                  onValueChange={(value) => handleInputChange(option.label, value)}
                  value={formData[option.label]}
                >
                  <SelectTrigger className={selectStyles.trigger}>
                    <SelectValue placeholder="Select an option" />
                  </SelectTrigger>
                  <SelectContent className={selectStyles.content}>
                    {option.choices?.map((choice) => (
                      <SelectItem 
                        key={choice} 
                        value={choice}
                        className={selectStyles.item}
                      >
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
                  {option.choices?.map((choice) => {
                    const isSelected = formData[option.label]?.includes(choice);
                    return (
                      <Button
                        key={choice}
                        variant={isSelected ? "default" : "outline"}
                        onClick={() => handleBubbleSelect(option.label, choice)}
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

              {option.type === 'input' && option.label === 'Add Hobby' && (
                <div>
                  <Input
                    placeholder={option.placeholder}
                    value={formData['Add Hobby'] || ''}
                    onChange={(e) => handleInputChange('Add Hobby', e.target.value)}
                    onBlur={() => handleAddHobby(formData['Add Hobby'])}
                  />
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData['Hobbies']?.map((hobby: string) => (
                      <Button
                        key={hobby}
                        variant="default"
                        className="rounded-full"
                      >
                        {hobby}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
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

      {/* <button
        onClick={handleUploadArtists}
        className="px-4 py-2 bg-blue-500 text-white rounded-md mt-4"
      >
        Upload Top Artists
      </button> */}
    </div>
  );
};

export default OnboardingStep; 