export const CONTENT_TYPES = ['post', 'carousel', 'reel', 'ad_creative'] as const;
export type ContentType = (typeof CONTENT_TYPES)[number];

export const CONTENT_STATUSES = [
  'draft',
  'pending_approval',
  'approved',
  'rejected',
  'needs_changes',
  'scheduled',
  'published',
] as const;
export type ContentStatus = (typeof CONTENT_STATUSES)[number];

export const USER_ROLES = ['doctor_approver', 'agency_admin'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export * from './compliance';
