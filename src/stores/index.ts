import { defineStore } from 'pinia'
import { getTelegramData } from '@/utils/telegram'
import { getUserProfile as fetchUserProfile, type UserProfile } from '@/services/puzzleApi'

const STORAGE_KEY = 'dolphia_auth'

export const useGlobalStore = defineStore('global', {
  state: () => ({
    apiToken: null as string | null,
    user: null as any,
    userProfile: null as UserProfile | null,
    transferToken: null as string | null,
    authInitialized: false,
    authError: null as string | null,
    loading: {
      auth: false,
      userProfile: false,
    }
  }),
  getters: {
    isAuthenticated: (state): boolean => {
      return !!state.apiToken
    },
    displayName: (state): string => {
      if (!state.user) return 'Player'
      return state.user.first_name || 'Player'
    },
    isTestEnvironment: (): boolean => {
      return !!import.meta.env.VITE_TEST_TRANSFER_TOKEN
    },
    decodedTransferToken: (state) => {
      if (!state.transferToken) return null
      try {
        return JSON.parse(atob(state.transferToken))
      } catch {
        return null
      }
    }
  },
  actions: {
    setApiToken(token: string) {
      this.apiToken = token
    },
    setUser(user: any) {
      this.user = user
    },
    getTelegramInfo() {
      return getTelegramData()
    },

    initAuth() {
      if (this.authInitialized) return
      this.authInitialized = true
      this.authError = null

      try {
        let token: string | null = null
        let isFromLocalStorage = false
        let isTestToken = false

        // Check test token from env
        if (import.meta.env.VITE_TEST_TRANSFER_TOKEN) {
          let parsedTestToken = JSON.parse(atob(import.meta.env.VITE_TEST_TRANSFER_TOKEN) ?? '{}')
          parsedTestToken.expiry = Date.now() + (365 * 24 * 60 * 60 * 1000)
          token = btoa(JSON.stringify(parsedTestToken))
          isTestToken = true
        }

        // If not test token, check localStorage or URL
        if (!isTestToken) {
          const storedAuth = localStorage.getItem(STORAGE_KEY)
          if (storedAuth) {
            try {
              const authData = JSON.parse(storedAuth)
              if (authData.expiry && Date.now() < authData.expiry) {
                token = authData.token
                isFromLocalStorage = true
              } else {
                localStorage.removeItem(STORAGE_KEY)
              }
            } catch {
              localStorage.removeItem(STORAGE_KEY)
            }
          }

          if (!token) {
            const urlParams = new URLSearchParams(window.location.search)
            token = urlParams.get('token')
          }
        }

        if (!token) {
          this.authError = 'No authentication token provided'
          return
        }

        this.transferToken = token
        const tokenData = this.decodedTransferToken

        if (!tokenData) {
          this.authError = 'Invalid or expired token'
          return
        }

        if (!tokenData.expiry || Date.now() > tokenData.expiry) {
          this.authError = 'Token expired. Please return to the main app to get a new token.'
          return
        }

        // Store in localStorage if new URL token
        if (!isFromLocalStorage && !isTestToken) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({
            token,
            expiry: tokenData.expiry || Date.now() + (60 * 60 * 1000)
          }))
        }

        this.apiToken = tokenData.apiToken
        this.user = tokenData.user
      } catch {
        this.authError = 'Failed to process authentication token'
      }
    },

    async getUserProfile() {
      if (!this.apiToken) return null
      this.loading.userProfile = true
      try {
        const data = await fetchUserProfile(this.apiToken)
        this.userProfile = data || null
        return data
      } catch (e) {
        console.error('Profile error', e)
        this.userProfile = null
        return null
      } finally {
        this.loading.userProfile = false
      }
    }
  }
})
