
import React from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface RecipientTypeSelectorProps {
  value: 'practitioner' | 'health_center';
  onChange: (value: 'practitioner' | 'health_center') => void;
}

export function RecipientTypeSelector({ value, onChange }: RecipientTypeSelectorProps) {
  return (
    <RadioGroup
      value={value}
      onValueChange={(value) => {
        onChange(value as 'practitioner' | 'health_center');
      }}
      className="grid grid-cols-2 gap-4"
    >
      <div>
        <RadioGroupItem
          value="practitioner"
          id="practitioner"
          className="peer sr-only"
        />
        <Label
          htmlFor="practitioner"
          className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
        >
          Médecin
        </Label>
      </div>
      <div>
        <RadioGroupItem
          value="health_center"
          id="health_center"
          className="peer sr-only"
        />
        <Label
          htmlFor="health_center"
          className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
        >
          Centre de santé
        </Label>
      </div>
    </RadioGroup>
  );
}
