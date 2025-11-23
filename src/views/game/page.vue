<script setup lang="ts">
import { ref, onMounted, computed, watch, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useGlobalStore } from '@/stores'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-vue-next'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import Loader from '@/components/layouts/Loader.vue'
import PassupGameScene from './PassupGameScene.vue'
import { toast } from 'vue-sonner'
import * as THREE from 'three'

const router = useRouter()
const globalStore = useGlobalStore()
const showBackDialog = ref(false)
const gameReady = ref(false)
const initError = ref<string | null>(null)
const selectedLevel = ref<number>(1)
const showLevelSelect = ref(false)
const showResultDialog = ref(false)
const gameSceneRef = ref<InstanceType<typeof PassupGameScene> | null>(null)
const backgroundCanvasRef = ref<HTMLCanvasElement | null>(null)
const selectedCharacter = ref<string>('character-a')

// CDN base URL for character assets
const CHARACTERS_CDN_BASE_URL = 'https://nj7106qpk4fk5k4z.public.blob.vercel-storage.com/passup/assets/characters/'

// Available characters (a through r)
const availableCharacters = [
  'character-a', 'character-b', 'character-c', 'character-d',
  'character-e', 'character-f', 'character-g', 'character-h',
  'character-i', 'character-j', 'character-k', 'character-l',
  'character-m', 'character-n', 'character-o', 'character-p',
  'character-q', 'character-r'
]

// Background 3D scene variables
let bgScene: THREE.Scene | null = null
let bgCamera: THREE.PerspectiveCamera | null = null
let bgRenderer: THREE.WebGLRenderer | null = null
let bgBlocks: Array<{ mesh: THREE.Mesh; speed: number; resetX: number }> = []
let bgAnimationId: number | null = null

const gameState = computed(() => globalStore.passupGame)
const currentShot = computed(() => {
  if (!gameState.value.shots || gameState.value.shots.length === 0) return null
  return gameState.value.shots[gameState.value.shots.length - 1]
})

const userScore = computed(() => gameState.value.score_user || 0)
const botScore = computed(() => gameState.value.score_bot || 0)
const currentRole = computed(() => gameState.value.current_user_role)
const gameFinished = computed(() => gameState.value.status === 'finished')

// Calculate correct result based on scores (frontend safeguard)
const actualResult = computed(() => {
  if (!gameState.value.result) return null
  const user = userScore.value
  const bot = botScore.value
  if (user > bot) return 'win'
  if (user < bot) return 'lose'
  return 'draw'
})

const confirmGoBack = () => {
  showBackDialog.value = true
}

const goBackToHome = () => {
  router.push('/')
}

const initializeGame = async () => {
  try {
    const data = await globalStore.getPassupGameStatus()

    if (data && data.ok) {
      if (data.status === 'ongoing') {
        // Continue existing game - pick new random characters for this session
        const botCharacterOptions = availableCharacters.filter(c => c !== selectedCharacter.value)
        const randomBotCharacter = botCharacterOptions[Math.floor(Math.random() * botCharacterOptions.length)]

        gameReady.value = true

        // Wait for scene to mount, then set characters
        await nextTick()
        if (gameSceneRef.value) {
          await gameSceneRef.value.setCharacters(selectedCharacter.value, randomBotCharacter)
        }
      } else if (data.status === 'open') {
        // Show level selection
        showLevelSelect.value = true
        gameReady.value = true
      }
    } else {
      // If status check fails (e.g., 500 error), assume game is open and allow new game
      console.warn('Could not fetch game status, defaulting to new game')
      showLevelSelect.value = true
      gameReady.value = true
    }
  } catch (error) {
    console.error('Failed to initialize game:', error)
    // On error, allow user to start a new game rather than blocking them
    showLevelSelect.value = true
    gameReady.value = true
    toast.error('Could not load game status, starting fresh')
  }
}

const startGame = async () => {
  try {
    // Pick a random bot character (different from user's selection)
    const botCharacterOptions = availableCharacters.filter(c => c !== selectedCharacter.value)
    const randomBotCharacter = botCharacterOptions[Math.floor(Math.random() * botCharacterOptions.length)]

    await globalStore.startPassupGame(selectedLevel.value)

    showLevelSelect.value = false

    // Wait for next tick to ensure game scene is rendered and mounted
    await nextTick()

    // Pass character selections to game scene
    if (gameSceneRef.value) {
      await gameSceneRef.value.setCharacters(selectedCharacter.value, randomBotCharacter)
    }

    toast.success('Game started!')
  } catch (error) {
    console.error('Failed to start game:', error)
    toast.error('Failed to start game')
  }
}

const makePass = async (direction: 'left' | 'center' | 'right') => {
  try {
    const result = await globalStore.makePass(direction)

    if (result && result.ok && gameSceneRef.value) {
      // Map user_direction and bot_direction based on role
      // If user is passer: user_direction = pass, bot_direction = blocker
      // If user is blocker: bot_direction = pass, user_direction = blocker
      const passDirection = result.role === 'passer' ? result.user_direction : result.bot_direction
      const blockerDirection = result.role === 'passer' ? result.bot_direction : result.user_direction

      // Trigger 3D animation
      gameSceneRef.value.animatePass(
        passDirection as 'left' | 'center' | 'right',
        blockerDirection as 'left' | 'center' | 'right',
        result
      )
    }
  } catch (error) {
    console.error('Failed to take shot:', error)
    toast.error('Failed to make pass')
  }
}

const handleGameOver = () => {
  // Game over, show result dialog
  setTimeout(() => {
    showResultDialog.value = true
  }, 500)
}

const playAgain = async () => {
  showResultDialog.value = false
  globalStore.resetPassupGame()
  if (gameSceneRef.value) {
    gameSceneRef.value.resetForNextShot()
  }
  showLevelSelect.value = true
}

// Background colors based on level
const levelBackgroundColors = computed(() => {
  switch (selectedLevel.value) {
    case 1:
      return {
        from: 'from-green-900',
        via: 'via-green-800',
        to: 'to-green-700',
        blockColor: 0x22c55e // green
      }
    case 2:
      return {
        from: 'from-yellow-900',
        via: 'via-yellow-800',
        to: 'to-yellow-700',
        blockColor: 0xeab308 // yellow
      }
    case 3:
      return {
        from: 'from-red-900',
        via: 'via-red-800',
        to: 'to-red-700',
        blockColor: 0xef4444 // red
      }
    default:
      return {
        from: 'from-green-900',
        via: 'via-green-800',
        to: 'to-green-700',
        blockColor: 0x22c55e
      }
  }
})

// Initialize background 3D scene
const initBackgroundScene = () => {
  if (!backgroundCanvasRef.value) return

  const canvas = backgroundCanvasRef.value
  const width = canvas.clientWidth
  const height = canvas.clientHeight

  // Scene
  bgScene = new THREE.Scene()
  bgScene.fog = new THREE.Fog(0x000000, 10, 50)

  // Camera
  bgCamera = new THREE.PerspectiveCamera(75, width / height, 0.1, 100)
  bgCamera.position.set(0, 5, 0)
  bgCamera.lookAt(0, 5, 20)

  // Renderer
  bgRenderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
  bgRenderer.setSize(width, height)
  bgRenderer.setClearColor(0x000000, 0)

  // Ambient light
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
  bgScene.add(ambientLight)

  // Directional light
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8)
  dirLight.position.set(5, 10, 5)
  bgScene.add(dirLight)

  // Create floating Minecraft blocks
  createFloatingBlocks()

  // Start animation
  animateBackground()
}

// Create floating blocks
const createFloatingBlocks = () => {
  if (!bgScene) return

  // Clear existing blocks
  bgBlocks.forEach(block => bgScene?.remove(block.mesh))
  bgBlocks = []

  const blockColor = levelBackgroundColors.value.blockColor
  const numBlocks = 40

  for (let i = 0; i < numBlocks; i++) {
    const size = Math.random() * 1.2 + 0.6
    const geometry = new THREE.BoxGeometry(size, size, size)
    const material = new THREE.MeshLambertMaterial({ color: blockColor })
    const mesh = new THREE.Mesh(geometry, material)

    // Random position - spread blocks across wider area
    mesh.position.x = Math.random() * 60 - 30
    mesh.position.y = Math.random() * 10 + 18  // Much higher up (18-28), above projectors
    mesh.position.z = Math.random() * 25 + 15 // Further back (15-40)

    // Random rotation
    mesh.rotation.x = Math.random() * Math.PI
    mesh.rotation.y = Math.random() * Math.PI
    mesh.rotation.z = Math.random() * Math.PI

    bgScene.add(mesh)

    bgBlocks.push({
      mesh,
      speed: Math.random() * 0.03 + 0.015,
      resetX: mesh.position.x > 0 ? 30 : -30
    })
  }
}

// Animate background blocks
const animateBackground = () => {
  if (!bgScene || !bgCamera || !bgRenderer) return

  bgAnimationId = requestAnimationFrame(animateBackground)

  // Move blocks horizontally like clouds
  bgBlocks.forEach(block => {
    block.mesh.position.x -= block.speed

    // Rotate blocks slowly
    block.mesh.rotation.x += 0.001
    block.mesh.rotation.y += 0.002

    // Reset position when off screen
    if (block.resetX > 0 && block.mesh.position.x < -30) {
      block.mesh.position.x = 30
    } else if (block.resetX < 0 && block.mesh.position.x > 30) {
      block.mesh.position.x = -30
    }
  })

  bgRenderer.render(bgScene, bgCamera)
}

// Cleanup background scene
const cleanupBackgroundScene = () => {
  if (bgAnimationId !== null) {
    cancelAnimationFrame(bgAnimationId)
    bgAnimationId = null
  }
  if (bgRenderer) {
    bgRenderer.dispose()
    bgRenderer = null
  }
  bgBlocks = []
  bgScene = null
  bgCamera = null
}

// Watch for level changes to update block colors
watch(selectedLevel, () => {
  if (bgScene) {
    createFloatingBlocks()
  }
})

// Watch for level select visibility to init/cleanup scene
watch(showLevelSelect, (isVisible) => {
  if (isVisible) {
    setTimeout(() => {
      initBackgroundScene()
    }, 100)
  } else {
    cleanupBackgroundScene()
  }
})

onMounted(async () => {
  // Ensure user is authenticated before accessing game
  if (!globalStore.userProfile || !globalStore.apiToken) {
    router.push('/')
    return
  }

  await initializeGame()
})

onUnmounted(() => {
  cleanupBackgroundScene()
})
</script>

<template>
  <div class="h-screen w-full flex flex-col bg-gradient-to-b from-green-900 via-green-800 to-green-900">
    <!-- Back button -->
    <div class="absolute top-4 left-4 z-10">
      <Button @click="confirmGoBack" size="sm" variant="secondary">
        <ArrowLeft class="w-4 h-4" />
        <span class="hidden sm:inline">Back to Home</span>
        <span class="sm:hidden">Back</span>
      </Button>
    </div>

    <!-- Loading state -->
    <div v-if="!gameReady && !initError" class="flex-1 w-full h-full flex items-center justify-center">
      <Loader title="LOADING PASS UP" subtitle="Preparing the field..." />
    </div>

    <!-- Error state -->
    <div v-else-if="initError" class="flex-1 w-full h-full flex items-center justify-center">
      <div class="text-center max-w-md mx-auto px-4">
        <p class="text-lg text-destructive mb-4">{{ initError }}</p>
        <Button @click="initializeGame">Try Again</Button>
      </div>
    </div>

    <!-- Level Selection -->
    <div
      v-else-if="showLevelSelect"
      class="flex-1 w-full h-full flex items-center justify-center p-4 bg-gradient-to-br relative overflow-hidden transition-all duration-700"
      :class="[levelBackgroundColors.from, levelBackgroundColors.via, levelBackgroundColors.to]"
    >
      <!-- 3D Background Canvas with Floating Blocks -->
      <canvas
        ref="backgroundCanvasRef"
        class="absolute inset-0 w-full h-full opacity-40"
        style="pointer-events: none;"
      ></canvas>

      <!-- Animated Background Pattern -->
      <div class="absolute inset-0 opacity-10">
        <div class="absolute top-0 left-0 w-full h-full" style="background-image: repeating-linear-gradient(0deg, transparent, transparent 50px, rgba(255,255,255,0.03) 50px, rgba(255,255,255,0.03) 100px), repeating-linear-gradient(90deg, transparent, transparent 50px, rgba(255,255,255,0.03) 50px, rgba(255,255,255,0.03) 100px);"></div>
      </div>

      <div class="bg-gradient-to-b from-gray-800 to-gray-900 border-8 border-gray-950 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.9)] p-8 max-w-md w-full relative z-10" style="font-family: 'Courier New', monospace; border-radius: 0;">
        <h2 class="text-3xl md:text-4xl font-bold mb-4 text-center text-white drop-shadow-[3px_3px_0px_rgba(0,0,0,1)]">
          SELECT DIFFICULTY
        </h2>
        <p class="text-gray-300 mb-8 text-center text-sm md:text-base">
          Choose your challenge level for the pass up game
        </p>

        <Select v-model="selectedLevel">
          <SelectTrigger class="w-full mb-6 bg-gray-700 border-4 border-gray-900 text-white font-bold py-3 text-lg hover:bg-gray-600 transition-all" style="border-radius: 0; font-family: 'Courier New', monospace;">
            <SelectValue placeholder="Select level" />
          </SelectTrigger>
          <SelectContent class="bg-gray-800 border-4 border-gray-950" style="border-radius: 0; font-family: 'Courier New', monospace;">
            <SelectItem :value="1" class="text-white hover:bg-green-700 cursor-pointer font-bold">⭐ LEVEL 1 - EASY</SelectItem>
            <SelectItem :value="2" class="text-white hover:bg-yellow-700 cursor-pointer font-bold">⭐⭐ LEVEL 2 - MEDIUM</SelectItem>
            <SelectItem :value="3" class="text-white hover:bg-red-700 cursor-pointer font-bold">⭐⭐⭐ LEVEL 3 - HARD</SelectItem>
          </SelectContent>
        </Select>

        <!-- Character Selection -->
        <div class="mb-6">
          <h3 class="text-xl font-bold text-white mb-3 text-center drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">
            SELECT YOUR CHARACTER
          </h3>
          <div class="grid grid-cols-4 gap-4 max-h-80 overflow-y-auto p-4 bg-black/30 border-4 border-gray-900" style="border-radius: 0;">
            <button
              v-for="character in availableCharacters"
              :key="character"
              @click="selectedCharacter = character"
              :class="[
                'border-4 p-1 transition-all hover:scale-105 aspect-square',
                selectedCharacter === character
                  ? 'border-blue-400 bg-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.5)]'
                  : 'border-gray-700 bg-gray-800/50 hover:border-gray-500'
              ]"
              style="border-radius: 0;"
            >
              <img
                :src="`${CHARACTERS_CDN_BASE_URL}${character}.png`"
                :alt="character"
                class="w-full h-full object-contain"
                style="image-rendering: pixelated;"
              />
            </button>
          </div>
        </div>

        <Button @click="startGame" class="w-full bg-gradient-to-b from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 border-4 border-blue-900 text-white font-bold py-4 text-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)] transition-all hover:scale-105 active:scale-95" size="lg" style="border-radius: 0;">
          ▶ START GAME
        </Button>
      </div>
    </div>

    <!-- Game Scene with 3D -->
    <div v-else class="flex-1 w-full h-full">
      <PassupGameScene
        ref="gameSceneRef"
        @pass="makePass"
        @game-over="handleGameOver"
      />
    </div>

    <!-- Game Result Dialog -->
    <Dialog v-model:open="showResultDialog">
      <DialogContent class="max-w-md bg-gradient-to-b from-gray-800 to-gray-900 border-8 border-gray-950 text-white" style="font-family: 'Courier New', monospace; border-radius: 0;">
        <DialogHeader>
          <DialogTitle
            class="text-4xl md:text-5xl font-bold text-center mb-4 drop-shadow-[3px_3px_0px_rgba(0,0,0,1)]"
            :class="actualResult === 'win' ? 'text-green-400' : actualResult === 'lose' ? 'text-red-400' : 'text-yellow-400'"
          >
            {{ actualResult === 'win' ? 'YOU WIN! 🏆' : actualResult === 'lose' ? 'YOU LOSE! 😢' : 'DRAW! 🤝' }}
          </DialogTitle>
          <DialogDescription class="text-center">
            <div class="space-y-6 mt-6">
              <!-- Score Display -->
              <div class="bg-black/50 border-4 border-gray-700 p-6" style="border-radius: 0;">
                <p class="text-sm text-gray-400 mb-3">FINAL SCORE</p>
                <div class="flex items-center justify-center gap-4 text-5xl font-bold">
                  <span class="text-green-400">{{ gameState.result?.user_passes ?? userScore }}</span>
                  <span class="text-gray-400">-</span>
                  <span class="text-red-400">{{ gameState.result?.bot_passes ?? botScore }}</span>
                </div>
                <div class="flex items-center justify-center gap-8 mt-3 text-xs text-gray-400">
                  <span>YOU</span>
                  <span>BOT</span>
                </div>
              </div>

              <!-- Tokens Earned -->
              <div class="bg-gradient-to-b from-green-700 to-green-800 border-4 border-green-950 p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)]" style="border-radius: 0;">
                <p class="text-lg font-bold text-green-100 mb-2">TOKENS EARNED</p>
                <p class="text-5xl font-bold text-white drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                  +{{ gameState.result?.tokens_awarded || 0 }}
                </p>
                <p class="text-sm text-green-200 mt-2">
                  Level {{ gameState.result?.level || gameState.level }}
                </p>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter class="flex-col sm:flex-row gap-3 mt-6">
          <Button
            variant="outline"
            @click="goBackToHome"
            class="flex-1 bg-gray-700 hover:bg-gray-600 border-4 border-gray-900 text-white font-bold py-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)] transition-all hover:scale-105 active:scale-95"
            style="border-radius: 0;"
          >
            GO HOME
          </Button>
          <Button
            @click="playAgain"
            class="flex-1 bg-blue-700 hover:bg-blue-600 border-4 border-blue-900 text-white font-bold py-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)] transition-all hover:scale-105 active:scale-95"
            style="border-radius: 0;"
          >
            PLAY AGAIN
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Confirmation dialog -->
    <Dialog v-model:open="showBackDialog">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Leave Game?</DialogTitle>
          <DialogDescription>
            Are you sure you want to go back to home? Your current game progress will be saved.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter class="flex-col sm:flex-row gap-3">
          <Button variant="outline" @click="showBackDialog = false" class="flex-1">
            Stay in Game
          </Button>
          <Button variant="destructive" @click="goBackToHome" class="flex-1">
            Go Back
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
