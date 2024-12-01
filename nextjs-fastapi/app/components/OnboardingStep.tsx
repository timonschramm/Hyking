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

}

const OnboardingStep: React.FC<OnboardingStepProps> = ({ stepData, onSelect, isLastStep, onBack, currentStep, validation }) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [topArtists, setTopArtists] = useState<Artist[]>([]);
  const [spotifyConnected, setSpotifyConnected] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  const connectToSpotify = () => {
    const clientId = '9b26ec7cde50497a86c271959cf91e99';
    const redirectUri = process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI || '';
    const scope = 'user-top-read';

    const authUrl = new URL('https://accounts.spotify.com/authorize');
    authUrl.searchParams.append('client_id', clientId);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('scope', scope);

    window.location.href = authUrl.toString();
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
      const response = await fetch('https://api.spotify.com/v1/me/top/artists?limit=5', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
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