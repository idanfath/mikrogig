type ProfileEnhancementAvailabilityInput = {
  title: string;
  bio: string;
  skills: string[];
  lastEnhancedTitle: string | null;
  lastEnhancedBio: string | null;
  processing: boolean;
};

export function getProfileEnhancementAvailability({
  title,
  bio,
  skills,
  lastEnhancedTitle,
  lastEnhancedBio,
  processing,
}: ProfileEnhancementAvailabilityInput) {
  return {
    title:
      !processing && title.trim() !== '' && title !== lastEnhancedTitle,
    bio: !processing && bio.trim() !== '' && bio !== lastEnhancedBio,
    skills:
      !processing && title.trim() !== '' && bio.trim() !== '' && skills.length === 0,
  };
}
