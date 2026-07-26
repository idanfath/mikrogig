export const CompressionLevels = {
  Low: 'low',
  Medium: 'medium',
  High: 'high',
} as const;
export type CompressionLevelType =
  (typeof CompressionLevels)[keyof typeof CompressionLevels];

export const CompressionProfiles = {
  ProfilePicture: 'profile_picture',
  GigPhoto: 'gig_photo',
} as const;
export type CompressionProfileType =
  (typeof CompressionProfiles)[keyof typeof CompressionProfiles];
