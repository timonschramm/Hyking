import { useState, useEffect } from 'react';
import OnboardingStep from './OnboardingStep';
import { Progress } from "@/components/ui/progress";
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";

interface Artist {
  name: string;
  images: { url: string }[];
  genres: string[];
}

const OnboardingFlow = () => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [userData, setUserData] = useState({});
  const [topArtists, setTopArtists] = useState<Artist[]>([]);
  const [spotifyConnected, setSpotifyConnected] = useState(false);

  const steps = [
    {
      title: 'Tell us about yourself',
      subtitle: 'This helps us personalize your experience',
      options: [
        { type: 'select' as const, label: 'Age', choices: ['18-24', '25-34', '35-44', '45-54', '55+'] },
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

  const connectToSpotify = () => {
    const clientId = '9b26ec7cde50497a86c271959cf91e99';
    const redirectUri = 'http://localhost:3000/callback';
    const scope = 'user-top-read';
    
    const authUrl = new URL('https://accounts.spotify.com/authorize');
    authUrl.searchParams.append('client_id', clientId);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('scope', scope);
    
    window.location.href = authUrl.toString();
  };

  useEffect(() => {
    // Check if we have a token in localStorage
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

  return (
    <div className="min-h-screen bg-base-200 flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-base-100 rounded-2xl shadow-xl p-8">
        <Progress 
          value={(currentStep / (steps.length - 1)) * 100} 
          className="mb-8"
        />
        
        <div className="mb-8">
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