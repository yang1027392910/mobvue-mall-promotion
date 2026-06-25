export type CurrentUserResponseData = ApiResponseData<{
  id?: number
  userId?: number
  user_id?: number
  sub?: number | string
  username?: string
  nickname?: string
  email?: string
  role?: string
  roles?: string[]
  status?: number
  verificationStatus?: number
  verification_status?: number
  inviteCode?: string
  invite_code?: string
  referralCode?: string
  referral_code?: string
  inviteCount?: number | string
  invite_count?: number | string
  invitedCount?: number | string
  invited_count?: number | string
  verifiedInviteCount?: number | string
  verified_invite_count?: number | string
  inviteVerifiedCount?: number | string
  invite_verified_count?: number | string
  inviteRequiredCount?: number | string
  invite_required_count?: number | string
}>
