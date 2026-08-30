import { create } from 'zustand'

import { ApiError, apiRequest } from '../lib/api'
import { profileSchema, profileUpdateSchema, type Profile, type ProfileUpdate } from '../lib/schemas'

type ProfileStatus = 'idle' | 'loading' | 'ready' | 'error'

interface ProfileState {
  status: ProfileStatus
  profile: Profile | null
  userId: string | null
  error: string | null
  load: (userId: string) => Promise<void>
  save: (changes: ProfileUpdate, userId: string) => Promise<Profile>
}

export const useProfileStore = create<ProfileState>((set) => ({
  status: 'idle',
  profile: null,
  userId: null,
  error: null,
  load: async (userId) => {
    set({ status: 'loading', error: null, userId, profile: null })
    try {
      const profile = profileSchema.parse(await apiRequest<unknown>('/api/v1/profile'))
      set({ status: 'ready', profile, userId })
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        set({ status: 'ready', profile: null, userId, error: null })
        return
      }
      set({ status: 'error', profile: null, userId, error: error instanceof Error ? error.message : 'Unable to load your profile.' })
    }
  },
  save: async (changes, userId) => {
    const payload = profileUpdateSchema.parse(changes)
    const profile = profileSchema.parse(await apiRequest<unknown>('/api/v1/profile', { method: 'PATCH', body: JSON.stringify(payload) }))
    set({ status: 'ready', profile, userId, error: null })
    return profile
  },
}))
