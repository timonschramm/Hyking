import { useState, useEffect } from 'react';
import { Skill, SkillLevel } from '@prisma/client';
import { Label } from '@/components/ui/label';
import { SelectionButton } from "../../ui";

interface SkillsOptionProps {
  skillName: string;
  skill: Skill & { skillLevels: SkillLevel[] };
  selectedLevelId: string | null;
  onSelect: (skillId: string, skillLevelId: string) => void;
}

export default function SkillsOption({ skillName, skill, selectedLevelId, onSelect }: SkillsOptionProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-medium text-primary">{skill.displayName}</h3>
      <div className="flex flex-wrap gap-2">
        {skill.skillLevels.map((level) => (
          <SelectionButton
            key={level.id}
            isSelected={selectedLevelId === level.id}
            onClick={() => onSelect(skill.id, level.id)}
          >
            {level.displayName}
          </SelectionButton>
        ))}
      </div>
    </div>
  );
} 