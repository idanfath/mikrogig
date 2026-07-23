import { X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ProfileEnhanceButton } from './profile-enhance-button';

type FreelancerFieldsProps = {
  title: string;
  bio: string;
  skills: string[];
  errors: {
    title?: string;
    bio?: string;
    skills?: string;
  };
  processing: boolean;
  onSkillsChange: (skills: string[]) => void;
  onTitleChange: (value: string) => void;
  onBioChange: (value: string) => void;
  availability: {
    title: boolean;
    bio: boolean;
    skills: boolean;
  };
  enhancingTitle: boolean;
  enhancingBio: boolean;
  enhancingSkills: boolean;
  onEnhanceTitle: () => void;
  onEnhanceBio: () => void;
  onEnhanceSkills: () => void;
};

function FreelancerFields({
  title,
  bio,
  skills,
  errors,
  processing,
  onSkillsChange,
  onTitleChange,
  onBioChange,
  availability,
  enhancingTitle,
  enhancingBio,
  enhancingSkills,
  onEnhanceTitle,
  onEnhanceBio,
  onEnhanceSkills,
}: FreelancerFieldsProps) {
  const [skillInput, setSkillInput] = useState('');
  const normalizedSkills = useMemo(() => normalizeSkills(skills), [skills]);

  useEffect(() => {
    if (!areSkillsEqual(skills, normalizedSkills)) {
      onSkillsChange(normalizedSkills);
    }
  }, [normalizedSkills, onSkillsChange, skills]);
  const addSkills = () => {
    const nextSkills = normalizeSkills([...normalizedSkills, skillInput]);

    if (nextSkills.length !== normalizedSkills.length) {
      onSkillsChange(nextSkills);
    }

    setSkillInput('');
  };

  const removeSkill = (skill: string) => {
    onSkillsChange(normalizedSkills.filter((item) => item !== skill));
  };

  return (
    <>
      <Field data-invalid={Boolean(errors.title)}>
        <div className="flex items-center justify-between gap-2">
          <FieldLabel htmlFor="title">Judul profil</FieldLabel>
          <ProfileEnhanceButton
            available={availability.title}
            loading={enhancingTitle}
            idleLabel="Tingkatkan dengan AI"
            onClick={onEnhanceTitle}
          />
        </div>
        <FieldDescription>
          Contoh: Tukang Las, Cleaning Service, Supir Pribadi, Buruh Bangunan,
          dll.
        </FieldDescription>
        <Input
          id="title"
          placeholder="Masukkan judul profilmu"
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
          aria-invalid={Boolean(errors.title)}
          disabled={processing || enhancingTitle}
        />
        <FieldError>{errors.title}</FieldError>
      </Field>
      <Field data-invalid={Boolean(errors.bio)}>
        <div className="flex items-center justify-between gap-2">
          <FieldLabel htmlFor="bio">Bio</FieldLabel>
          <ProfileEnhanceButton
            available={availability.bio}
            loading={enhancingBio}
            idleLabel="Tingkatkan dengan AI"
            onClick={onEnhanceBio}
          />
        </div>
        <FieldDescription>
          Ceritakan tentang dirimu dan pengalamanmu
        </FieldDescription>
        <Textarea
          id="bio"
          rows={3}
          placeholder="Saya seorang tukang las dengan pengalaman 5 tahun..."
          value={bio}
          onChange={(event) => onBioChange(event.target.value)}
          aria-invalid={Boolean(errors.bio)}
          disabled={processing || enhancingBio}
        />
        <FieldError>{errors.bio}</FieldError>
      </Field>
      <Field data-invalid={Boolean(errors.skills)}>
        <div className="flex items-center justify-between gap-2">
          <FieldLabel>Keahlian</FieldLabel>
          <ProfileEnhanceButton
            available={availability.skills}
            loading={enhancingSkills}
            idleLabel="Rekomendasikan Keahlian"
            onClick={onEnhanceSkills}
          />
        </div>
        <FieldDescription>Tambahkan keahlian yang kamu miliki</FieldDescription>
        <Input
          placeholder="Contoh: Las, Cat, Listrik"
          value={skillInput}
          onChange={(event) => setSkillInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              addSkills();
            }
          }}
          disabled={processing || enhancingSkills}
        />
        <Button
          type="button"
          variant="outline"
          onClick={addSkills}
          disabled={processing || enhancingSkills}
        >
          Tambah
        </Button>
        <FieldError>{errors.skills}</FieldError>
        {normalizedSkills.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {normalizedSkills.map((skill) => (
              <Badge key={skill} variant="accent" className="gap-1">
                {skill}
                <button
                  type="button"
                  onClick={() => removeSkill(skill)}
                  className="ml-1 hover:text-destructive"
                  aria-label={`Hapus ${skill}`}
                >
                  <X className="size-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </Field>
    </>
  );
}

function normalizeSkills(skills: string[]): string[] {
  return [
    ...new Set(
      skills
        .flatMap((skill) => skill.split(','))
        .map((skill) => skill.trim().toLowerCase())
        .filter(Boolean),
    ),
  ];
}

function areSkillsEqual(first: string[], second: string[]): boolean {
  return (
    first.length === second.length &&
    first.every((skill, index) => skill === second[index])
  );
}

export { FreelancerFields, normalizeSkills };
