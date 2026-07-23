import { useHttp } from '@inertiajs/react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { getProfileEnhancementAvailability } from '@/features/profile/lib/profile-enhancement';
import freelancer from '@/routes/freelancer';

type UseProfileEnhanceOptions = {
  title: string;
  bio: string;
  skills: string[];
  location: string;
  formProcessing?: boolean;
  onTitleChange: (value: string) => void;
  onBioChange: (value: string) => void;
  onSkillsChange: (skills: string[]) => void;
};

function toastEnhanceError(error: any, fallback: string) {
  if (error?.response?.status === 429) {
    toast.error('Coba Lagi Nanti.');

    return;
  }

  toast.error(error.message || fallback);
}

export function useProfileEnhance({
  title,
  bio,
  skills,
  location,
  formProcessing = false,
  onTitleChange,
  onBioChange,
  onSkillsChange,
}: UseProfileEnhanceOptions) {
  const [enhancingTitle, setEnhancingTitle] = useState(false);
  const [enhancingBio, setEnhancingBio] = useState(false);
  const [enhancingSkills, setEnhancingSkills] = useState(false);
  const [lastEnhancedTitle, setLastEnhancedTitle] = useState<string | null>(
    null,
  );
  const [lastEnhancedBio, setLastEnhancedBio] = useState<string | null>(null);
  const enhanceHttp = useHttp({
    field: '',
    value: '',
    context: { title: '', bio: '', skills: [] as string[], location: '' },
  });

  const availability = getProfileEnhancementAvailability({
    title,
    bio,
    skills,
    lastEnhancedTitle,
    lastEnhancedBio,
    processing:
      formProcessing ||
      enhancingTitle ||
      enhancingBio ||
      enhancingSkills ||
      enhanceHttp.processing,
  });

  const enhance = async (field: 'title' | 'bio') => {
    const value = field === 'title' ? title : bio;

    if (!value.trim()) {
      return;
    }

    if (field === 'title') {
      setEnhancingTitle(true);
    } else {
      setEnhancingBio(true);
    }

    enhanceHttp.transform(() => ({
      field,
      value,
      context: {
        title,
        bio,
        skills,
        location,
      },
    }));

    try {
      const response = await enhanceHttp.post(freelancer.enhance.url());
      const result = response as { value?: string };

      if (result.value) {
        if (field === 'title') {
          onTitleChange(result.value);
          setLastEnhancedTitle(result.value);
        } else {
          onBioChange(result.value);
          setLastEnhancedBio(result.value);
        }

        if (result.value !== value) {
          toast.success('Profil berhasil ditingkatkan.');
        }
      }
    } catch (error: any) {
      toastEnhanceError(error, 'Gagal meningkatkan dengan AI');
    } finally {
      if (field === 'title') {
        setEnhancingTitle(false);
      } else {
        setEnhancingBio(false);
      }
    }
  };

  const enhanceSkills = async () => {
    if (!title.trim() || !bio.trim()) {
      return;
    }

    setEnhancingSkills(true);
    enhanceHttp.transform(() => ({
      field: 'skills',
      value: '',
      context: {
        title,
        bio,
        skills,
        location,
      },
    }));

    try {
      const response = await enhanceHttp.post(freelancer.enhance.url());
      const result = response as { value?: string[] };

      if (Array.isArray(result.value)) {
        const nextSkills = [...skills];

        result.value.forEach((skill) => {
          const normalizedSkill = skill.trim().toLowerCase();

          if (normalizedSkill && !nextSkills.includes(normalizedSkill)) {
            nextSkills.push(normalizedSkill);
          }
        });

        onSkillsChange(nextSkills);
        toast.success('Rekomendasi keahlian berhasil ditambahkan.');
      }
    } catch (error: any) {
      toastEnhanceError(error, 'Gagal merekomendasikan keahlian');
    } finally {
      setEnhancingSkills(false);
    }
  };

  const resetLastEnhanced = () => {
    setLastEnhancedTitle(null);
    setLastEnhancedBio(null);
  };

  return {
    availability,
    enhancingTitle,
    enhancingBio,
    enhancingSkills,
    enhance,
    enhanceSkills,
    resetLastEnhanced,
  };
}
