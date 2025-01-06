import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface BasicInformationStepProps {
  formData: Record<string, any>;
  errors: Record<string, string>;
  onChange: (field: string, value: any) => void;
}

export function BasicInformationStep({ formData, errors, onChange }: BasicInformationStepProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="age">Age</Label>
        <Input
          id="age"
          type="number"
          min={13}
          max={120}
          value={formData.age || ''}
          onChange={(e) => onChange('age', e.target.value)}
          className={errors.age ? 'border-red-500 focus:ring-red-500' : ''}
          aria-invalid={errors.age ? 'true' : 'false'}
        />
        {errors.age && (
          <p className="text-sm text-red-500 mt-1">{errors.age}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="gender">Gender</Label>
        <Select
          value={formData.gender || ''}
          onValueChange={(value) => onChange('gender', value)}
        >
          <SelectTrigger id="gender" className={errors.gender ? 'border-red-500' : ''}>
            <SelectValue placeholder="Select your gender" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Male">Male</SelectItem>
            <SelectItem value="Female">Female</SelectItem>
            <SelectItem value="Non-binary">Non-binary</SelectItem>
            <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
          </SelectContent>
        </Select>
        {errors.gender && (
          <p className="text-sm text-red-500 mt-1">{errors.gender}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          type="text"
          placeholder="Enter your city"
          value={formData.location || ''}
          onChange={(e) => onChange('location', e.target.value)}
          className={errors.location ? 'border-red-500 focus:ring-red-500' : ''}
          aria-invalid={errors.location ? 'true' : 'false'}
        />
        {errors.location && (
          <p className="text-sm text-red-500 mt-1">{errors.location}</p>
        )}
      </div>
    </div>
  );
} 