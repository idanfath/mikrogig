import { useHttp } from '@inertiajs/react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { enhance as enhanceAction } from '@/actions/App/Http/Controllers/GigController';

type UseGigEnhanceOptions = {
  title: string;
  description: string;
  category: string;
  formProcessing?: boolean;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
};

function toastEnhanceError(error: any, fallback: string) {
  if (error?.response?.status === 429) {
    toast.error('Coba Lagi Nanti.');

    return;
  }

  toast.error(error?.message || fallback);
}

export function useGigEnhance({
  title,
  description,
  category,
  formProcessing = false,
  onTitleChange,
  onDescriptionChange,
}: UseGigEnhanceOptions) {
  const [enhancingTitle, setEnhancingTitle] = useState(false);
  const [enhancingDescription, setEnhancingDescription] = useState(false);

  const enhanceHttp = useHttp({
    field: '',
    value: '',
    context: { title: '', description: '', category: '' },
  });

  const canEnhanceTitle =
    Boolean(title.trim()) && !formProcessing && !enhancingTitle;
  const canEnhanceDescription =
    Boolean(description.trim()) && !formProcessing && !enhancingDescription;

  const enhance = async (field: 'title' | 'description') => {
    const value = field === 'title' ? title : description;

    if (!value.trim()) {
      return;
    }

    if (field === 'title') {
      setEnhancingTitle(true);
    } else {
      setEnhancingDescription(true);
    }

    enhanceHttp.transform(() => ({
      field,
      value,
      context: {
        title,
        description,
        category,
      },
    }));

    try {
      const response = await enhanceHttp.post(enhanceAction.url());
      const result = response as { value?: string };

      if (result.value) {
        if (field === 'title') {
          onTitleChange(result.value);
        } else {
          onDescriptionChange(result.value);
        }

        if (result.value !== value) {
          toast.success(
            field === 'title'
              ? 'Judul gig berhasil ditingkatkan.'
              : 'Deskripsi gig berhasil ditingkatkan.',
          );
        }
      }
    } catch (error: any) {
      toastEnhanceError(error, 'Gagal meningkatkan dengan AI');
    } finally {
      if (field === 'title') {
        setEnhancingTitle(false);
      } else {
        setEnhancingDescription(false);
      }
    }
  };

  return {
    enhancingTitle,
    enhancingDescription,
    canEnhanceTitle,
    canEnhanceDescription,
    enhanceTitle: () => enhance('title'),
    enhanceDescription: () => enhance('description'),
  };
}
