import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Skill, SkillLevel, UserSkill } from '@prisma/client';
import SkillsOption from '../StepOptions/SkillsOption';

interface PreferencesStepProps {
  onNext: () => void;
  onBack: () => void;
  initialData?: {
    skills?: (UserSkill & {
      skill: Skill;
      skillLevel: SkillLevel;
    })[];
  };
  onDataChange: (data: any) => void;
}

export default function PreferencesStep({
  onNext,
  onBack,
  initialData,
  onDataChange,
}: PreferencesStepProps) {
  const [skills, setSkills] = useState<(Skill & { skillLevels: SkillLevel[] })[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSkills() {
      try {
        const response = await fetch('/apinextjs/profile/skills');
        if (!response.ok) throw new Error('Failed to fetch skills');
        const data = await response.json();
        setSkills(data);

        // Initialize selected skills from initial data
        if (initialData?.skills) {
          const initialSkills = initialData.skills.reduce((acc, userSkill) => ({
            ...acc,
            [userSkill.skillId]: userSkill.skillLevelId,
          }), {});
          setSelectedSkills(initialSkills);
        }
      } catch (error) {
        console.error('Error fetching skills:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchSkills();
  }, [initialData]);

  const handleSkillSelect = (skillId: string, skillLevelId: string) => {
    const updatedSkills = { ...selectedSkills, [skillId]: skillLevelId };
    setSelectedSkills(updatedSkills);
    
    // Transform to the format expected by the API
    const skillsData = Object.entries(updatedSkills).map(([skillId, skillLevelId]) => ({
      skillId,
      skillLevelId,
    }));
    
    onDataChange({ skills: skillsData });
  };

  if (loading) {
    return <div>Loading preferences...</div>;
  }

  return (
 

      <div className="space-y-6">
        {skills.map((skill) => (
          <SkillsOption
            key={skill.id}
            skillName={skill.name.toLowerCase()}
            skill={skill}
            selectedLevelId={selectedSkills[skill.id] || null}
            onSelect={handleSkillSelect}
          />
        ))}
      </div>

   
  );
} 