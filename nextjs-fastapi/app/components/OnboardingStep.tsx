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
}

const OnboardingStep: React.FC<OnboardingStepProps> = ({ stepData, onSelect, isLastStep, onBack, currentStep, validation, initialValues }) => {
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