import { apiRequest } from '@/utils/api'
import { defineStore } from 'pinia'
import { toUserFriendlyAddress } from '@tonconnect/sdk'

interface Avatar {
  url: string
  pathname: string
  filename: string
  size: number
  uploadedAt: Date
}

interface UserRate {
  total: number
  correct: number
  wrong: number
  accuracy: number
  bayes_score: number
  wilson_lb: number
  final_score: number
}

interface UserProfile {
  user_info: {
    display_name: string
    avatar: string
    nickname?: string
  }
  total_predictions: number
  wins: number
  rate: UserRate
  nft: any[]
  follower: number
  allow_copy?: any
  copy_fee?: any
  metadata?: {
    admin_role?: boolean
  }
}

// PassUp Ladder Game Types
interface GridCell {
  id: number
  game_id: number
  cell: number
  type: 'empty' | 'pass' | 'bot' | 'reward'
  value: number
}

interface PlayerPosition {
  id: number
  game_id: number
  user_id: number
  start: number
  rolls: number
  finished: boolean
}

interface GamePlayer {
  id: number
  user_id: number
  nickname?: string
  avatar?: string
  position: number
  rolls: number
  finished: boolean
  finished_at: string | null
}

interface LadderGameGrid {
  id: number
  date: string
  seed: number
  started_at: string
  finished: boolean
  finished_at: string | null
  reward_clamed: boolean
  countdown: string
  grid: GridCell[]
}

interface RollResult {
  ok: boolean
  dice: number
  from: number
  to: number
  rolls?: number
  event: 'move' | 'bot' | 'pass' | 'invalid'
  reward?: {
    type: string
    amount: number
  } | null
  finished: boolean
  reason?: string
}

interface LadderGameState {
  grid: LadderGameGrid | null
  position: PlayerPosition | null
  players: GamePlayer[]
  selectedField: string | null
  isRolling: boolean
  lastRoll: RollResult | null
}

// Daily Top Player for leaderboard
interface DailyTopPlayer {
  id: number
  nickname: string
  avatar: string
  user_id: number
  position: number
  rolls: number
  finished: boolean
  finished_at: string | null
}

export const useGlobalStore = defineStore('global', {
  state: () => {
    return {
      mode: null,
      avatar: null,
      avatars: [] as Avatar[],
      avatarCache: new Map<string, string>(),
      pendingTasks: null,
      apiToken: null,
      walletAddress: null,
      user: null,
      pendingTasksCount: 0,
      tokenSum: 0,
      userProfile: null as UserProfile | null,
      transferToken: null as string | null,
      userEnergyPercentage: 0, // User's energy level (0-100)
      intentionallyLeftGame: false, // Track if user manually left the game
      // Ladder game state
      ladderGame: {
        grid: null,
        position: null,
        players: [],
        selectedField: null,
        isRolling: false,
        lastRoll: null
      } as LadderGameState,
      // Daily top players for leaderboard
      dailyTopPlayers: [] as DailyTopPlayer[],
      loading: {
        walletAddress: false,
        pendingTasksCount: false,
        tokenSum: false,
        avatars: false,
        userProfile: false,
        energy: false,
        ladderGame: false,
        dailyTop: false
      }
    };
  },
  getters: {
    isAdmin: (state): boolean => {
      return state.userProfile?.metadata?.admin_role === true;
    },
    
    isOriginalAdmin: (state): boolean => {
      const prefs = JSON.parse(localStorage.getItem('prefs') || '{}')
      return prefs.originalMetadata?.admin_role === true || state.userProfile?.metadata?.admin_role === true;
    },
    
    decodedTransferToken: (state) => {
      if (!state.transferToken) return null;
      
      try {
        const decoded = atob(state.transferToken);
        return JSON.parse(decoded);
      } catch (error) {
        console.error('Failed to decode transferToken:', error);
        return null;
      }
    },
    
    generateToken: (state): string => {
      const storeData = {
        mode: state.mode,
        avatar: state.avatar,
        avatars: state.avatars,
        avatarCache: Object.fromEntries(state.avatarCache), // Convert Map to Object
        pendingTasks: state.pendingTasks,
        apiToken: state.apiToken,
        walletAddress: state.walletAddress,
        user: state.user,
        pendingTasksCount: state.pendingTasksCount,
        tokenSum: state.tokenSum,
        userProfile: state.userProfile,
        timestamp: Date.now()
      }
      
      // Encode as Base64 token
      return btoa(JSON.stringify(storeData));
    },
    
    parsedWalletAddress: (state: any) => {
      if (!state.walletAddress) return;
      return toUserFriendlyAddress(state.walletAddress, true);
    },

    // Get cached avatar URL by filename
    getCachedAvatar: (state) => {
      return (filename: string) => state.avatarCache.get(filename);
    },

    // Get avatar by filename from the list
    getAvatarByFilename: (state) => {
      return (filename: string) => state.avatars.find(avatar =>
        avatar.filename === filename || avatar.pathname.endsWith(filename)
      );
    },

    // Get avatar URL with caching (as a getter function)
    getAvatarUrl: (state) => {
      return async (filename: string): Promise<string | null> => {
        // Check cache first
        const cachedUrl = state.avatarCache.get(filename);
        if (cachedUrl) {
          return cachedUrl;
        }

        // Find in current avatars list
        const avatar = state.avatars.find(av =>
          av.filename === filename || av.pathname.endsWith(filename)
        );

        if (avatar) {
          state.avatarCache.set(filename, avatar.url);
          return avatar.url;
        }

        return null;
      };
    },

    // Energy getters
    energyPercentage: (state): number => {
      return state.userEnergyPercentage
    },

    hasEnergy: (state): boolean => {
      return state.userEnergyPercentage > 0
    },

    canPlayGame: (state): boolean => {
      return state.userEnergyPercentage >= 20 // Need at least 20% to play
    }
  },
  actions: {
    setMode(mode: any) {
      this.mode = mode;
    },
    setAvatar(avatar: any) {
      this.avatar = avatar;
    },
    setApiToken(apiToken: any) {
      this.apiToken = apiToken;
    },
    setUser(user: any) {
      this.user = user;
    },
    setWalletAddress(walletAddress: string) {
      this.walletAddress = walletAddress as any
    },
    async loadAvatars() {
      try {
        this.loading.avatars = true;

        // Clear existing avatars and cache
        this.avatars = [];
        this.avatarCache.clear();

        let currentPage = 1;
        let hasMore = true;
        const limit = 100; // Items per page

        // Helper function to get base URL
        const getBaseUrl = () => {
          if (typeof window !== 'undefined') {
            // If we're in browser and hostname is localhost, use localhost
            if (window.location.hostname === 'localhost') {
              return 'http://localhost:3000';
            }
            // Otherwise use the current origin
            return window.location.origin;
          }
          // Server-side fallback
          return 'http://localhost:3000';
        };

        console.log('Starting to load all avatars...');

        while (hasMore) {
          console.log(`Fetching page ${currentPage}...`);

          const baseUrl = getBaseUrl();
          const response = await fetch(
            `${baseUrl}/api/list?path=app/img/avatars/&includeFiles=true&includeFolders=false&page=${currentPage}&limit=${limit}`
          );

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status} on page ${currentPage}`);
          }

          const data = await response.json();

          if (!data.success) {
            throw new Error(data.error || `Failed to load avatars on page ${currentPage}`);
          }

          // Extract files from current page
          const pageAvatars = data.data.files.map((file) => ({
            url: file.url,
            pathname: file.pathname,
            filename: file.filename,
            size: file.size,
            uploadedAt: new Date(file.uploadedAt),
            contentType: file.contentType
          }));

          // Add to main avatars array
          this.avatars.push(...pageAvatars);

          // Cache URLs for current page
          pageAvatars.forEach(avatar => {
            this.avatarCache.set(avatar.filename, avatar.url);
            this.avatarCache.set(avatar.pathname, avatar.url);
          });

          console.log(`Page ${currentPage}: loaded ${pageAvatars.length} avatars. Total: ${this.avatars.length}`);

          // Check if there are more pages
          hasMore = data.pagination && data.pagination.hasNext;
          currentPage++;

          // Safety check to prevent infinite loops
          if (currentPage > 50) {
            console.warn('Reached maximum page limit (50), stopping pagination');
            break;
          }
        }

        console.log(`✅ Finished loading all avatars. Total: ${this.avatars.length} avatars across ${currentPage - 1} pages`);

      } catch (error) {
        console.error('Failed to load avatars:', error);
        this.avatars = [];
        this.avatarCache.clear();
        throw error; // Re-throw so components can handle the error
      } finally {
        this.loading.avatars = false;
      }
    },
    async getAvatarUrlAction(filename: string) {
      // Check cache first
      const cachedUrl = this.avatarCache.get(filename);
      if (cachedUrl) {
        return cachedUrl;
      }

      // If not in cache and avatars not loaded, load them
      if (this.avatars.length === 0 && !this.loading.avatars) {
        try {
          await this.loadAvatars();
          return this.avatarCache.get(filename) || null;
        } catch (error) {
          console.error('Failed to load avatars:', error);
          return null;
        }
      }

      // Find in current avatars list
      const avatar = this.avatars.find(av =>
        av.filename === filename || av.pathname.endsWith(filename)
      );

      if (avatar) {
        this.avatarCache.set(filename, avatar.url);
        return avatar.url;
      }

      return null;
    },
    async refreshAvatars() {
      console.log('Refreshing all avatars...');
      await this.loadAvatars();
    },
    cacheAvatarUrl(filename: string, url: string) {
      this.avatarCache.set(filename, url);
    },
    clearAvatarCache() {
      this.avatarCache.clear();
    },
    async getWalletAddress() {
      try {
        this.loading.walletAddress = true
        const data = await apiRequest('/User/Wallet', { method: 'GET' }, this.apiToken)
        if (typeof data === 'string') {
          this.walletAddress = data as any
        }
      } catch (error) {
        console.error('Failed to fetch user wallet from API:', error)
        this.walletAddress = null
      } finally {
        this.loading.walletAddress = false
      }
    },
    async getPendingTasks() {
      try {
        this.loading.pendingTasksCount = true
        const data = await apiRequest('/Task/Available', { method: 'GET' }, this.apiToken)
        this.pendingTasksCount = Number(data) || 0
      } catch (e) {
        console.error('Pending tasks error', e)
        this.pendingTasksCount = 0
      } finally {
        this.loading.pendingTasksCount = false
      }
    },
    async getTokenSum() {
      try {
        if (!this.apiToken) throw new Error('API token is missing');
        this.loading.tokenSum = true
        const data = await apiRequest('/User/SumTokens', { method: 'GET' }, this.apiToken)
        this.tokenSum = data || 0
      } catch (e) {
        console.error('Sum error', e)
        this.tokenSum = 0
      } finally {
        this.loading.tokenSum = false
      }
    },
    async getUserProfile() {
      try {
        if (!this.apiToken) throw new Error('API token is missing');
        this.loading.userProfile = true
        const data = await apiRequest('/User/Profile', { method: 'GET' }, this.apiToken)
        
        if (data) {
          // Store original metadata in localStorage for admin simulation
          const prefs = JSON.parse(localStorage.getItem('prefs') || '{}')
          if (!prefs.originalMetadata && data.metadata) {
            prefs.originalMetadata = data.metadata
            localStorage.setItem('prefs', JSON.stringify(prefs))
          }
          
          // Check if we should simulate non-admin view
          if (prefs.simulateNonAdmin && data.metadata?.admin_role) {
            data.metadata = null
          }
        }
        
        this.userProfile = data || null
        return data
      } catch (e) {
        console.error('Profile error', e)
        this.userProfile = null
        return null
      } finally {
        this.loading.userProfile = false
      }
    },
    async getUserAvatar() {
      try {
        if (!this.apiToken) throw new Error('API token is missing');
        const data = await apiRequest('/User/Avatar', { method: 'GET' }, this.apiToken)
        if (data) {
          this.setAvatar(data)
        }
        return data
      } catch (e) {
        console.error('Avatar error', e)
        return null
      }
    },
    toggleAdminSimulation() {
      const prefs = JSON.parse(localStorage.getItem('prefs') || '{}')
      
      if (!this.userProfile) return
      
      // Toggle simulation state
      prefs.simulateNonAdmin = !prefs.simulateNonAdmin
      localStorage.setItem('prefs', JSON.stringify(prefs))
      
      // Update current userProfile metadata
      if (prefs.simulateNonAdmin) {
        // Store original if not already stored
        if (!prefs.originalMetadata && this.userProfile.metadata) {
          prefs.originalMetadata = this.userProfile.metadata
          localStorage.setItem('prefs', JSON.stringify(prefs))
        }
        // Set metadata to null to simulate non-admin
        this.userProfile.metadata = null
      } else {
        // Restore original metadata
        this.userProfile.metadata = prefs.originalMetadata || null
      }
    },
    getAdminSimulationState() {
      const prefs = JSON.parse(localStorage.getItem('prefs') || '{}')
      return prefs.simulateNonAdmin || false
    },
    async fetchUserEnergy() {
      this.loading.energy = true
      try {
        if (!this.apiToken) throw new Error('API token is missing');
        const data = await apiRequest('/User/Energy', { method: 'GET' }, this.apiToken)

        // Response format: { energy: 0-100 }
        if (typeof data.energy === 'number') {
          this.userEnergyPercentage = data.energy
          return { ok: true, energy: data.energy }
        } else {
          return { ok: false, message: 'Invalid energy data received' }
        }
      } catch (err: any) {
        console.error('Failed to fetch user energy:', err)
        this.userEnergyPercentage = 0
        return { ok: false, message: err?.message || 'Failed to load energy data.' }
      } finally {
        this.loading.energy = false
      }
    },

    // ========== Ladder Game Actions ==========

    // Join the ladder game - GET /PassUp/Join
    async joinLadderGame() {
      try {
        if (!this.apiToken) throw new Error('API token is missing')
        this.loading.ladderGame = true

        const data = await apiRequest('/PassUp/Join', { method: 'GET', skipTlg: true }, this.apiToken)

        if (data && data.ok) {
          // API returns { ok, data: { grid: { ...gridInfo, grid: [...cells] }, position: {...} } }
          const responseData = data.data || data

          // Handle grid data - can be nested in data.grid or directly in data
          if (responseData.grid) {
            this.ladderGame.grid = {
              id: responseData.grid.id,
              date: responseData.grid.date,
              seed: responseData.grid.seed,
              started_at: responseData.grid.started_at,
              finished: responseData.grid.finished,
              finished_at: responseData.grid.finished_at,
              reward_clamed: responseData.grid.reward_clamed || false,
              countdown: responseData.grid.countdown,
              grid: responseData.grid.grid || []
            }
          }

          // Handle position data
          if (responseData.position) {
            this.ladderGame.position = {
              id: responseData.position.id,
              game_id: responseData.position.game_id,
              user_id: responseData.position.user_id,
              start: responseData.position.start,
              rolls: responseData.position.rolls,
              finished: responseData.position.finished
            }
          }
        }

        return data
      } catch (e) {
        console.error('Join ladder game error', e)
        throw e
      } finally {
        this.loading.ladderGame = false
      }
    },

    // Roll dice - GET /PassUp/Roll
    async rollLadderDice() {
      try {
        if (!this.apiToken) throw new Error('API token is missing')
        this.ladderGame.isRolling = true

        const data = await apiRequest('/PassUp/Roll', { method: 'GET', skipTlg: true }, this.apiToken) as RollResult

        if (data) {
          this.ladderGame.lastRoll = data

          // Always update rolls count from response (even on invalid rolls)
          if (this.ladderGame.position && data.rolls !== undefined) {
            this.ladderGame.position.rolls = data.rolls
          }

          // Update position if roll was successful
          if (data.ok && this.ladderGame.position) {
            this.ladderGame.position = {
              ...this.ladderGame.position,
              start: data.to,
              finished: data.finished
            }
          }
        }

        return data
      } catch (e) {
        console.error('Roll dice error', e)
        throw e
      } finally {
        this.ladderGame.isRolling = false
      }
    },

    // Get all players - GET /PassUp/Players
    async getLadderPlayers() {
      try {
        if (!this.apiToken) throw new Error('API token is missing')

        const data = await apiRequest('/PassUp/Players', { method: 'GET', skipTlg: true }, this.apiToken)

        if (data && Array.isArray(data)) {
          this.ladderGame.players = data
        } else if (data && data.players) {
          this.ladderGame.players = data.players
        }

        return data
      } catch (e) {
        console.error('Get ladder players error', e)
        return []
      }
    },

    // Get daily top players for leaderboard - GET /PassUp/DailyTop
    async getDailyTop() {
      try {
        if (!this.apiToken) throw new Error('API token is missing')
        this.loading.dailyTop = true

        const data = await apiRequest('/PassUp/DailyTop', { method: 'GET', skipTlg: true }, this.apiToken)

        if (data && Array.isArray(data)) {
          // Sort by rolls ascending (fewest rolls first)
          this.dailyTopPlayers = data.sort((a, b) => a.rolls - b.rolls)
        }

        return data
      } catch (e) {
        console.error('Get daily top players error', e)
        return []
      } finally {
        this.loading.dailyTop = false
      }
    },

    // Set selected field/stadium
    setLadderField(field: string) {
      this.ladderGame.selectedField = field
    },

    // Reset ladder game state
    resetLadderGame() {
      this.ladderGame = {
        grid: null,
        position: null,
        players: [],
        selectedField: null,
        isRolling: false,
        lastRoll: null
      }
    }
  }
});