<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useGlobalStore } from '@/stores'
import { useClubStore } from '@/stores/clubStore'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent
} from '@/components/ui/dialog'
import { ArrowLeft, Dumbbell, Utensils, Zap, Clock, Loader2, Trophy, Plus, BedDouble } from 'lucide-vue-next'
import { Input } from '@/components/ui/input'
import StatBox from '@/components/layouts/StatBox.vue'
import EnergyBar from '@/components/layouts/EnergyBar.vue'
import PositionBadge from '@/components/layouts/PositionBadge.vue'
import Loader from '@/components/layouts/Loader.vue'
import * as THREE from 'three'
import type { Player, TrainingOption } from '@/services/clubApi'

const router = useRouter()
const globalStore = useGlobalStore()
const clubStore = useClubStore()

const canvasContainer = ref<HTMLDivElement | null>(null)
const isInitializing = ref(true)
const needsClubCreation = ref(false)
const clubName = ref('')
const createError = ref('')

// Player interaction state
const selectedPlayer = ref<Player | null>(null)
const showPlayerDialog = ref(false)
const showTrainDialog = ref(false)
const actionError = ref('')
const actionSuccess = ref('')

let camera: THREE.OrthographicCamera
let renderer: THREE.WebGLRenderer
let scene: THREE.Scene
let animationFrameId: number
let textureLoaderRef: THREE.TextureLoader
let raycaster: THREE.Raycaster
let pointer: THREE.Vector2

// Pan and zoom state
let isPanning = false
let pointerDownTime = 0
let pointerMoved = false
const TAP_THRESHOLD = 200 // ms - clicks shorter than this are taps, not pans
let startX = 0
let startY = 0
let cameraStartX = 0
let cameraStartY = 0

// Touch state for pinch-to-zoom
let initialPinchDistance = 0
let initialZoom = 0
let isTouchPanning = false
let touchStartX = 0
let touchStartY = 0

// Zoom level: smaller value = see more (zoomed out), larger value = see less (zoomed in)
const MAX_ZOOM_IN = 0.2
const MAX_ZOOM_OUT = 1
let currentZoom = MAX_ZOOM_OUT
let frustumSize = 10
let planeWidth = 0
let planeHeight = 0

// Animation options with correct frame counts
const dolphinAnimations = [
  { name: 'Happy', path: '/sprites/dolphin_happy.png', frames: 6, state: 'idle' },
  { name: 'Training', path: '/sprites/dolphin_training.png', frames: 8, state: 'training' },
  { name: 'Defeated', path: '/sprites/dolphin_defeated.png', frames: 8, state: 'tired' }
]

const botAnimations = [
  { name: 'Aggressive', path: '/sprites/bot_aggressive.png', frames: 7, state: 'idle' },
  { name: 'Training', path: '/sprites/bot_training.png', frames: 8, state: 'training' },
  { name: 'Tired', path: '/sprites/bot_tired.png', frames: 8, state: 'tired' },
  { name: 'Defeated', path: '/sprites/bot_defeated.png', frames: 8, state: 'resting' }
]

// Sprite animation state
interface AnimatedSprite {
  mesh: THREE.Mesh
  frameCount: number
  currentFrame: number
  frameTime: number
  lastFrameTime: number
  team: 'dolphin' | 'bot'
  position: { x: number; y: number; z: number }
  flipX: boolean
  animationComplete: boolean
  isReversing: boolean
  holdOnLastFrame: boolean // Hold on last frame while task is active
  playerId?: number // Link to actual player
  looping: boolean // Whether animation should loop
  currentAnimState?: string // Track current animation state for change detection
}
const animatedSprites: AnimatedSprite[] = []

// Track previous player states to detect task completion
const previousPlayerStates = new Map<number, { task: string | null; taskEndsAt: string | null }>()

// Flag to prevent animation updates during initial scene setup
let isSceneInitialized = false

// Character positions from Godot (scaled: divide by 300)
// Formation: 1 GK, 2 DEF, 2 MID, 1 ATT
const dolphinPositions = [
  { x: -371 / 300, y: -(-308) / 300, z: 1, role: 'MID' },        // Dolphin-Left-Mid (top left)
  { x: -60 / 300, y: -(-290) / 300, z: 1, role: 'ATT' },         // Dolphin-Attack (top center)
  { x: 42 / 300, y: -(-42) / 300, z: 1, role: 'MID' },           // Dolphin-Right-Mid
  { x: -665 / 300, y: -(-257) / 300, z: 1, role: 'DEF' },        // Dolphin-Left-Defender
  { x: -107 / 300, y: -(96) / 300, z: 1, role: 'DEF' },          // Dolphin-Right-Defender
  { x: -431 / 300, y: -(-26) / 300, z: 1, role: 'GK' }           // Dolphin-Goalkeeper
]

const botPositions = [
  { x: 554 / 300, y: -(-635) / 300, z: 3 },    // Bot-Goalkeeper (z=3 to appear in front of goal)
  { x: 167 / 300, y: -(-740) / 300, z: 1 },    // Bot-Right-Defender
  { x: 720 / 300, y: -(-397) / 300, z: 1 },    // Bot-Left-Defender
  { x: 115 / 300, y: -(-564) / 300, z: 1 },    // Bot-Right-Mid
  { x: 452 / 300, y: -(-362) / 300, z: 1 },    // Bot-Left-Mid
  { x: 117 / 300, y: -(-378) / 300, z: 1 }     // Bot-Left-Attack
]

const spriteSize = 0.8

const goBack = () => {
  router.push('/')
}

// Create club
const handleCreateClub = async () => {
  if (!clubName.value.trim()) {
    createError.value = 'Please enter a club name'
    return
  }

  createError.value = ''
  const result = await clubStore.createClub(clubName.value.trim())

  if (result.ok) {
    needsClubCreation.value = false
    // Initialize scene after club is created
    clubStore.fetchTrainingOptions()
    initScene()
  } else {
    createError.value = result.message || 'Failed to create club'
  }
}

// Animation state types for tracking
type AnimState = 'idle' | 'training' | 'resting' | 'feeding' | 'tired' | 'match'

// Helper to check if player is resting (API format: "rest:type:duration:energy" like "rest:full:40:0")
const isPlayerResting = (currentTask: string | null): boolean => {
  return currentTask?.startsWith('rest:') || false
}

// Helper to check if player has any active task
const hasActiveTask = (currentTask: string | null): boolean => {
  return currentTask === 'training' || currentTask === 'match' || isPlayerResting(currentTask)
}

// Get animation based on player state
const getAnimationForPlayerState = (
  player: Player | null,
  team: 'dolphin' | 'bot'
): { path: string; frames: number; looping: boolean; holdOnLastFrame: boolean; state: AnimState } => {
  const anims = team === 'dolphin' ? dolphinAnimations : botAnimations

  if (!player) {
    // Default idle animation
    return { path: anims[0].path, frames: anims[0].frames, looping: false, holdOnLastFrame: false, state: 'idle' }
  }

  // Map player state to animation
  // Training: current_task === 'training'
  if (player.current_task === 'training') {
    const trainAnim = anims.find(a => a.state === 'training') || anims[0]
    // Training: play animation, hold on last frame while training
    return { path: trainAnim.path, frames: trainAnim.frames, looping: false, holdOnLastFrame: true, state: 'training' }
  }

  // Resting: current_task format is "rest:type:duration:energy" (e.g., "rest:full:40:0" or "rest:short:15:0")
  if (isPlayerResting(player.current_task)) {
    // Resting: use defeated/tired animation (sleeping pose), hold on last frame
    // TODO: Add dolphin_resting.png for better resting animation
    const restAnim = anims.find(a => a.state === 'resting') || anims.find(a => a.state === 'tired') || anims[0]
    return { path: restAnim.path, frames: restAnim.frames, looping: false, holdOnLastFrame: true, state: 'resting' }
  }

  // Match: current_task === 'match'
  if (player.current_task === 'match') {
    // Match: use training animation for active play, loop during match
    const matchAnim = anims.find(a => a.state === 'training') || anims[0]
    return { path: matchAnim.path, frames: matchAnim.frames, looping: true, holdOnLastFrame: false, state: 'match' }
  }

  if (player.energy < 30) {
    const tiredAnim = anims.find(a => a.state === 'tired') || anims[0]
    return { path: tiredAnim.path, frames: tiredAnim.frames, looping: false, holdOnLastFrame: false, state: 'tired' }
  }

  // Default idle/happy
  return { path: anims[0].path, frames: anims[0].frames, looping: false, holdOnLastFrame: false, state: 'idle' }
}

// Create animated sprite from sprite sheet
const createAnimatedSprite = (
  texturePath: string,
  frameCount: number,
  position: { x: number; y: number; z: number },
  size: number,
  textureLoader: THREE.TextureLoader,
  flipX: boolean = false,
  team: 'dolphin' | 'bot',
  playerId?: number,
  looping: boolean = false,
  holdOnLastFrame: boolean = false,
  animState: AnimState = 'idle',
  startAtLastFrame: boolean = false // When true, start at last frame (for existing tasks on page load)
): Promise<AnimatedSprite> => {
  return new Promise((resolve) => {
    textureLoader.load(texturePath, (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace
      texture.magFilter = THREE.LinearFilter
      texture.minFilter = THREE.LinearFilter
      texture.wrapS = THREE.ClampToEdgeWrapping
      texture.wrapT = THREE.ClampToEdgeWrapping

      const sheetWidth = texture.image.width
      const sheetHeight = texture.image.height
      const frameWidth = sheetWidth / frameCount
      const frameAspect = frameWidth / sheetHeight

      const frameRatio = 1 / frameCount
      texture.repeat.set(frameRatio * 0.98, 0.98)

      // If starting at last frame, set offset to last frame position
      const startFrame = startAtLastFrame ? frameCount - 1 : 0
      texture.offset.set(startFrame * frameRatio + 0.01 * frameRatio, 0.01)

      // Debug: log the start frame
      console.log(`[createAnimatedSprite] startAtLastFrame:`, startAtLastFrame, 'startFrame:', startFrame, 'frameCount:', frameCount, 'path:', texturePath)

      const geometry = new THREE.PlaneGeometry(size * frameAspect, size)
      const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        side: THREE.DoubleSide
      })

      const mesh = new THREE.Mesh(geometry, material)
      mesh.position.set(position.x, position.y, position.z)

      if (flipX) {
        mesh.scale.x = -1
      }

      scene.add(mesh)

      const sprite: AnimatedSprite = {
        mesh,
        frameCount,
        currentFrame: startFrame,
        frameTime: 50,
        lastFrameTime: 0,
        team,
        position,
        flipX,
        animationComplete: startAtLastFrame, // If starting at last frame, animation is already complete
        isReversing: false,
        holdOnLastFrame,
        playerId,
        looping,
        currentAnimState: animState
      }

      animatedSprites.push(sprite)
      resolve(sprite)
    })
  })
}

// Update sprite texture with support for reversing animation
const updateSpriteTexture = (
  sprite: AnimatedSprite,
  texturePath: string,
  frameCount: number,
  textureLoader: THREE.TextureLoader,
  looping: boolean = false,
  holdOnLastFrame: boolean = false,
  newAnimState: AnimState = 'idle',
  shouldReverse: boolean = false // True when transitioning from a held state back to idle
) => {
  // If we're reversing the current animation (task completed), don't load new texture
  if (shouldReverse && sprite.currentAnimState !== 'idle') {
    sprite.isReversing = true
    sprite.animationComplete = false
    sprite.holdOnLastFrame = false
    sprite.looping = false
    // Will reverse from current frame back to 0, then switch to idle
    return
  }

  textureLoader.load(texturePath, (texture) => {
    texture.colorSpace = THREE.SRGBColorSpace
    texture.magFilter = THREE.LinearFilter
    texture.minFilter = THREE.LinearFilter
    texture.wrapS = THREE.ClampToEdgeWrapping
    texture.wrapT = THREE.ClampToEdgeWrapping

    const sheetWidth = texture.image.width
    const sheetHeight = texture.image.height
    const frameWidth = sheetWidth / frameCount
    const frameAspect = frameWidth / sheetHeight

    const frameRatio = 1 / frameCount
    texture.repeat.set(frameRatio * 0.98, 0.98)
    texture.offset.set(0.01 * frameRatio, 0.01)

    const material = sprite.mesh.material as THREE.MeshBasicMaterial
    material.map?.dispose()
    material.map = texture
    material.needsUpdate = true

    sprite.mesh.geometry.dispose()
    sprite.mesh.geometry = new THREE.PlaneGeometry(spriteSize * frameAspect, spriteSize)

    sprite.frameCount = frameCount
    sprite.currentFrame = 0
    sprite.animationComplete = false
    sprite.isReversing = false
    sprite.holdOnLastFrame = holdOnLastFrame
    sprite.looping = looping
    sprite.lastFrameTime = 0
    sprite.currentAnimState = newAnimState
  })
}

// Update animations based on player states
const updatePlayerAnimations = () => {
  clubStore.players.forEach((player) => {
    const sprite = animatedSprites.find(s => s.playerId === player.id)
    if (!sprite) return

    const prevState = previousPlayerStates.get(player.id)
    const animConfig = getAnimationForPlayerState(player, 'dolphin')

    // Check if a timed task just completed (had active task, now doesn't)
    // Use hasActiveTask to properly detect rest:* format tasks
    const hadActiveTask = prevState?.task && hasActiveTask(prevState.task)
    const nowHasActiveTask = hasActiveTask(player.current_task)
    const taskJustCompleted = hadActiveTask && !nowHasActiveTask

    // Check if this is the first time we're seeing this player (no previous state)
    // In that case, don't do anything - the sprite was already created with correct state
    const isFirstUpdate = !prevState
    if (isFirstUpdate) {
      // Just record the state for future comparisons, don't change the sprite
      previousPlayerStates.set(player.id, {
        task: player.current_task,
        taskEndsAt: player.task_ends_at
      })
      return
    }

    // Update previous state tracking
    previousPlayerStates.set(player.id, {
      task: player.current_task,
      taskEndsAt: player.task_ends_at
    })

    // If task just completed and sprite is holding on last frame, reverse the animation
    if (taskJustCompleted && sprite.holdOnLastFrame && sprite.currentFrame > 0) {
      // Start reverse animation - will go back to frame 0, then switch to idle
      updateSpriteTexture(
        sprite,
        animConfig.path,
        animConfig.frames,
        textureLoaderRef,
        animConfig.looping,
        animConfig.holdOnLastFrame,
        animConfig.state,
        true // shouldReverse = true
      )
    } else if (sprite.currentAnimState !== animConfig.state) {
      // Animation state changed, load new animation
      updateSpriteTexture(
        sprite,
        animConfig.path,
        animConfig.frames,
        textureLoaderRef,
        animConfig.looping,
        animConfig.holdOnLastFrame,
        animConfig.state,
        false
      )
    }
  })
}

// Watch for player state changes
watch(
  () => clubStore.players.map(p => `${p.id}-${p.current_task}-${p.energy}`).join(','),
  () => {
    // Don't update animations during initial scene setup - sprites are created with correct state
    if (isSceneInitialized && animatedSprites.length > 0 && textureLoaderRef) {
      updatePlayerAnimations()
    }
  }
)

// Update sprite animation
const updateSpriteAnimation = (sprite: AnimatedSprite, time: number) => {
  // If holding on last frame and reached the end, don't animate further
  if (sprite.holdOnLastFrame && sprite.currentFrame >= sprite.frameCount - 1 && !sprite.isReversing) {
    return
  }

  // If animation is complete and not looping or reversing, don't animate
  if (sprite.animationComplete && !sprite.looping && !sprite.isReversing) return

  if (time - sprite.lastFrameTime > sprite.frameTime) {
    if (sprite.isReversing) {
      // Reversing: go from current frame back to 0
      if (sprite.currentFrame <= 0) {
        sprite.animationComplete = true
        sprite.isReversing = false
        sprite.currentAnimState = 'idle'
        // After reverse completes, we need to load the idle animation
        // This will be handled by the next updatePlayerAnimations call
        return
      }
      sprite.currentFrame--
    } else {
      // Forward animation
      if (sprite.currentFrame >= sprite.frameCount - 1) {
        if (sprite.looping) {
          // Loop back to start
          sprite.currentFrame = 0
        } else if (sprite.holdOnLastFrame) {
          // Hold on last frame - don't change currentFrame
          return
        } else {
          sprite.animationComplete = true
          return
        }
      } else {
        sprite.currentFrame++
      }
    }

    const texture = (sprite.mesh.material as THREE.MeshBasicMaterial).map
    if (texture) {
      const frameRatio = 1 / sprite.frameCount
      texture.offset.x = sprite.currentFrame * frameRatio + 0.01 * frameRatio
    }
    sprite.lastFrameTime = time
  }
}

// Handle player click (from squad list or sprite tap)
const handlePlayerClick = (playerId: number) => {
  const player = clubStore.players.find(p => p.id === playerId)
  if (player) {
    selectedPlayer.value = player
    showPlayerDialog.value = true
    actionError.value = ''
  }
}

// Check if a sprite was tapped using raycasting
const checkSpriteTap = (clientX: number, clientY: number): boolean => {
  if (!canvasContainer.value || !raycaster || !pointer) return false

  const rect = canvasContainer.value.getBoundingClientRect()
  pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1
  pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1

  raycaster.setFromCamera(pointer, camera)

  // Get all dolphin meshes that have player IDs
  const dolphinMeshes = animatedSprites
    .filter(s => s.team === 'dolphin' && s.playerId !== undefined)
    .map(s => s.mesh)

  const intersects = raycaster.intersectObjects(dolphinMeshes)

  if (intersects.length > 0) {
    // Find which sprite was clicked
    const clickedMesh = intersects[0].object
    const sprite = animatedSprites.find(s => s.mesh === clickedMesh)
    if (sprite && sprite.playerId) {
      handlePlayerClick(sprite.playerId)
      return true
    }
  }
  return false
}

// Open train dialog
const openTrainDialog = () => {
  showPlayerDialog.value = false
  showTrainDialog.value = true
  actionError.value = ''

  if (clubStore.trainingOptions.length === 0) {
    clubStore.fetchTrainingOptions()
  }
}

// Train player
const handleTrain = async (type: 'light' | 'balanced' | 'conditioning' | 'finishing') => {
  if (!selectedPlayer.value) return

  actionError.value = ''
  const result = await clubStore.trainPlayer(selectedPlayer.value.id, type)

  if (result.ok) {
    showTrainDialog.value = false
    selectedPlayer.value = null
    actionSuccess.value = 'Training started!'
    setTimeout(() => (actionSuccess.value = ''), 3000)
  } else {
    actionError.value = result.message || 'Failed to start training'
  }
}

// Trigger a quick animation for instant actions (like feeding)
const triggerInstantAnimation = (playerId: number, animType: 'feeding') => {
  const sprite = animatedSprites.find(s => s.playerId === playerId)
  if (!sprite) return

  // For feeding: use happy animation, play once forward then reverse back
  // TODO: Add dolphin_eating.png for dedicated eating animation
  const anims = dolphinAnimations
  const feedAnim = anims.find(a => a.state === 'idle') || anims[0] // Use happy for now

  // Store original state to restore after animation
  const originalState = sprite.currentAnimState

  // Load the animation and set it to play forward then reverse
  textureLoaderRef.load(feedAnim.path, (texture) => {
    texture.colorSpace = THREE.SRGBColorSpace
    texture.magFilter = THREE.LinearFilter
    texture.minFilter = THREE.LinearFilter
    texture.wrapS = THREE.ClampToEdgeWrapping
    texture.wrapT = THREE.ClampToEdgeWrapping

    const sheetWidth = texture.image.width
    const sheetHeight = texture.image.height
    const frameWidth = sheetWidth / feedAnim.frames
    const frameAspect = frameWidth / sheetHeight

    const frameRatio = 1 / feedAnim.frames
    texture.repeat.set(frameRatio * 0.98, 0.98)
    texture.offset.set(0.01 * frameRatio, 0.01)

    const material = sprite.mesh.material as THREE.MeshBasicMaterial
    material.map?.dispose()
    material.map = texture
    material.needsUpdate = true

    sprite.mesh.geometry.dispose()
    sprite.mesh.geometry = new THREE.PlaneGeometry(spriteSize * frameAspect, spriteSize)

    sprite.frameCount = feedAnim.frames
    sprite.currentFrame = 0
    sprite.animationComplete = false
    sprite.isReversing = false
    sprite.holdOnLastFrame = false
    sprite.looping = false
    sprite.lastFrameTime = 0
    sprite.currentAnimState = 'feeding'

    // After animation plays forward, set flag to reverse
    // This is handled by watching when animation completes forward
    setTimeout(() => {
      if (sprite.currentAnimState === 'feeding' && sprite.currentFrame >= sprite.frameCount - 1) {
        sprite.isReversing = true
        sprite.animationComplete = false
      }
    }, feedAnim.frames * sprite.frameTime + 100)
  })
}

// Feed player
const handleFeed = async () => {
  if (!selectedPlayer.value) return

  const playerId = selectedPlayer.value.id
  actionError.value = ''
  const result = await clubStore.feedPlayers([playerId])

  if (result.ok) {
    showPlayerDialog.value = false
    // Trigger feeding animation
    triggerInstantAnimation(playerId, 'feeding')
    selectedPlayer.value = null
    actionSuccess.value = 'Player fed!'
    setTimeout(() => (actionSuccess.value = ''), 3000)
  } else {
    actionError.value = result.message || 'Failed to feed player'
  }
}

// Rest player
const handleRest = async (type: 'short' | 'full') => {
  if (!selectedPlayer.value) return

  actionError.value = ''
  const result = await clubStore.restPlayer(selectedPlayer.value.id, type)

  if (result.ok) {
    showPlayerDialog.value = false
    selectedPlayer.value = null
    actionSuccess.value = 'Player is now resting!'
    setTimeout(() => (actionSuccess.value = ''), 3000)
  } else {
    actionError.value = result.message || 'Failed to rest player'
  }
}

// Format time remaining
const formatTimeLeft = (taskEndsAt: string | null): string => {
  if (!taskEndsAt) return ''
  const endTime = new Date(taskEndsAt).getTime()
  const now = Date.now()
  const diff = endTime - now

  if (diff <= 0) return 'Completing...'

  const minutes = Math.floor(diff / 60000)
  const seconds = Math.floor((diff % 60000) / 1000)

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`
  }
  return `${seconds}s`
}

const initScene = () => {
  if (!canvasContainer.value) return

  const width = canvasContainer.value.clientWidth
  const height = canvasContainer.value.clientHeight

  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x0a0812)

  const aspect = width / height
  const initialSize = frustumSize * currentZoom
  camera = new THREE.OrthographicCamera(
    (initialSize * aspect) / -2,
    (initialSize * aspect) / 2,
    initialSize / 2,
    initialSize / -2,
    0.1,
    1000
  )
  camera.position.z = 10

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(width, height)
  renderer.setPixelRatio(window.devicePixelRatio)
  canvasContainer.value.appendChild(renderer.domElement)

  // Initialize raycaster for sprite selection
  raycaster = new THREE.Raycaster()
  pointer = new THREE.Vector2()

  textureLoaderRef = new THREE.TextureLoader()

  // Load background texture
  textureLoaderRef.load('/scene/main.webp', async (texture) => {
    texture.colorSpace = THREE.SRGBColorSpace

    const imgAspect = texture.image.width / texture.image.height
    const coverageMultiplier = 1 / MAX_ZOOM_OUT

    if (aspect > imgAspect) {
      planeWidth = frustumSize * aspect * coverageMultiplier
      planeHeight = planeWidth / imgAspect
    } else {
      planeHeight = frustumSize * coverageMultiplier
      planeWidth = planeHeight * imgAspect
    }

    const geometry = new THREE.PlaneGeometry(planeWidth, planeHeight)
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true
    })
    const plane = new THREE.Mesh(geometry, material)
    plane.position.z = 0
    scene.add(plane)

    // Create cloud/fog sprites around the field
    const createCloudTexture = () => {
      const canvas = document.createElement('canvas')
      const size = 256
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')!

      // Create soft cloud-like shape using multiple radial gradients
      const centerX = size / 2
      const centerY = size / 2

      // Main cloud body - soft white gradient
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, size / 2)
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)')
      gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.25)')
      gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.1)')
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')

      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, size, size)

      // Add some cloud puffs for organic shape
      const puffs = [
        { x: size * 0.3, y: size * 0.4, r: size * 0.25 },
        { x: size * 0.7, y: size * 0.35, r: size * 0.2 },
        { x: size * 0.5, y: size * 0.6, r: size * 0.22 },
        { x: size * 0.25, y: size * 0.6, r: size * 0.18 },
        { x: size * 0.75, y: size * 0.55, r: size * 0.15 },
      ]

      puffs.forEach(puff => {
        const puffGradient = ctx.createRadialGradient(puff.x, puff.y, 0, puff.x, puff.y, puff.r)
        puffGradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)')
        puffGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.15)')
        puffGradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
        ctx.fillStyle = puffGradient
        ctx.fillRect(0, 0, size, size)
      })

      return new THREE.CanvasTexture(canvas)
    }

    // Create large fog clouds that drift slowly above the field
    const cloudTexture = createCloudTexture()
    const fogClouds: THREE.Sprite[] = []
    const baseScale = Math.max(planeWidth, planeHeight) * 0.4 // Much larger clouds
    const cloudPositions = [
      // Large clouds drifting across the field - faster, more noticeable movement
      { x: -planeWidth * 0.3, y: planeHeight * 0.25, scale: baseScale * 1.2, speed: 0.0004 },
      { x: planeWidth * 0.2, y: -planeHeight * 0.15, scale: baseScale * 1.0, speed: 0.0003 },
      { x: 0, y: planeHeight * 0.1, scale: baseScale * 1.4, speed: 0.00035 },
      { x: -planeWidth * 0.15, y: -planeHeight * 0.3, scale: baseScale * 0.9, speed: 0.00045 },
      { x: planeWidth * 0.35, y: planeHeight * 0.2, scale: baseScale * 1.1, speed: 0.00025 },
      // Edge clouds - still large
      { x: -planeWidth * 0.45, y: 0, scale: baseScale * 1.0, speed: 0.0003 },
      { x: planeWidth * 0.45, y: -planeHeight * 0.1, scale: baseScale * 0.95, speed: 0.00035 },
      { x: 0, y: -planeHeight * 0.35, scale: baseScale * 1.15, speed: 0.0004 },
    ]

    cloudPositions.forEach((cloudPos, index) => {
      const cloudMaterial = new THREE.SpriteMaterial({
        map: cloudTexture,
        transparent: true,
        opacity: 0.20 + Math.random() * 0.10, // Slightly more visible
        depthWrite: false,
      })

      const cloud = new THREE.Sprite(cloudMaterial)
      cloud.position.set(cloudPos.x, cloudPos.y, 2)
      cloud.scale.set(cloudPos.scale, cloudPos.scale * 0.6, 1)
      cloud.userData = {
        baseX: cloudPos.x,
        baseY: cloudPos.y,
        speed: cloudPos.speed,
        offset: index * 500,
        driftX: planeWidth * 0.25, // Large horizontal drift
        driftY: planeHeight * 0.15, // Large vertical drift
      }
      scene.add(cloud)
      fogClouds.push(cloud)
    })

    // Store fog clouds for animation
    ;(window as any).__fogClouds = fogClouds

    // Create dolphins - match players to field positions by their role
    const players = [...clubStore.players]
    const assignedPlayerIds = new Set<number>()

    for (const pos of dolphinPositions) {
      // Find an unassigned player matching this position's role
      const player = players.find(p => p.position === pos.role && !assignedPlayerIds.has(p.id))
      if (player) {
        assignedPlayerIds.add(player.id)
        // Initialize previous state tracking
        previousPlayerStates.set(player.id, {
          task: player.current_task,
          taskEndsAt: player.task_ends_at
        })
      }

      const animConfig = player
        ? getAnimationForPlayerState(player, 'dolphin')
        : { path: dolphinAnimations[0].path, frames: dolphinAnimations[0].frames, looping: false, holdOnLastFrame: false, state: 'idle' as AnimState }

      // If player already has an active task (training, resting, match), start at last frame
      // This ensures characters show in their task pose when page loads
      const playerHasActiveTask = player && hasActiveTask(player.current_task)
      const shouldStartAtLastFrame = playerHasActiveTask && animConfig.holdOnLastFrame

      // Debug logging
      console.log(`[Dolphin ${pos.role}] Player:`, player?.id, 'Task:', player?.current_task,
        'hasActiveTask:', playerHasActiveTask, 'holdOnLastFrame:', animConfig.holdOnLastFrame,
        'shouldStartAtLastFrame:', shouldStartAtLastFrame, 'animState:', animConfig.state)

      await createAnimatedSprite(
        animConfig.path,
        animConfig.frames,
        { x: pos.x, y: pos.y, z: pos.z },
        spriteSize,
        textureLoaderRef,
        true,
        'dolphin',
        player?.id,
        animConfig.looping,
        animConfig.holdOnLastFrame,
        animConfig.state,
        shouldStartAtLastFrame // Start at last frame if player already has active task
      )
    }

    // Create bots on right side
    for (const pos of botPositions) {
      await createAnimatedSprite(
        botAnimations[0].path,
        botAnimations[0].frames,
        pos,
        spriteSize,
        textureLoaderRef,
        false,
        'bot',
        undefined,
        false
      )
    }

    // Load goal images (z=2 to appear in front of players)
    const loadGoal = (path: string, x: number, y: number, height: number) => {
      textureLoaderRef.load(path, (goalTexture) => {
        goalTexture.colorSpace = THREE.SRGBColorSpace
        const goalAspect = goalTexture.image.width / goalTexture.image.height
        const goalWidth = height * goalAspect
        const goalGeometry = new THREE.PlaneGeometry(goalWidth, height)
        const goalMaterial = new THREE.MeshBasicMaterial({
          map: goalTexture,
          transparent: true
        })
        const goalMesh = new THREE.Mesh(goalGeometry, goalMaterial)
        goalMesh.position.set(x, y, 2)
        scene.add(goalMesh)
      })
    }

    // Left goal (dolphin side) - adjusted position and scale
    loadGoal('/scene/left-goal.webp', -2.15, -0.2, 2)
    // Right goal (bot side) - adjusted position and scale
    loadGoal('/scene/right-goal.webp', 2.4, 2.5, 2)

    // Mark scene as initialized - now watch can update animations
    isSceneInitialized = true
    isInitializing.value = false
  })

  // Zoom handler
  const handleWheel = (e: WheelEvent) => {
    e.preventDefault()
    const zoomSpeed = 0.001
    currentZoom += e.deltaY * zoomSpeed
    currentZoom = Math.max(MAX_ZOOM_IN, Math.min(MAX_ZOOM_OUT, currentZoom))
    updateCameraZoom()
  }

  // Pan handlers
  const handlePointerDown = (e: PointerEvent) => {
    isPanning = true
    pointerDownTime = Date.now()
    pointerMoved = false
    startX = e.clientX
    startY = e.clientY
    cameraStartX = camera.position.x
    cameraStartY = camera.position.y
    canvasContainer.value?.setPointerCapture(e.pointerId)
  }

  const clampCameraPosition = () => {
    if (planeWidth === 0 || planeHeight === 0) return

    const w = canvasContainer.value!.clientWidth
    const h = canvasContainer.value!.clientHeight
    const aspect = w / h
    const viewWidth = frustumSize * currentZoom * aspect
    const viewHeight = frustumSize * currentZoom

    const maxPanX = Math.max(0, (planeWidth - viewWidth) / 2)
    const maxPanY = Math.max(0, (planeHeight - viewHeight) / 2)

    camera.position.x = Math.max(-maxPanX, Math.min(maxPanX, camera.position.x))
    camera.position.y = Math.max(-maxPanY, Math.min(maxPanY, camera.position.y))
  }

  const handlePointerMove = (e: PointerEvent) => {
    if (!isPanning) return

    const deltaX = e.clientX - startX
    const deltaY = e.clientY - startY

    // Check if pointer has moved enough to be considered a drag
    if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
      pointerMoved = true
    }

    const worldUnitsPerPixel = (frustumSize * currentZoom) / canvasContainer.value!.clientHeight

    camera.position.x = cameraStartX - deltaX * worldUnitsPerPixel
    camera.position.y = cameraStartY + deltaY * worldUnitsPerPixel

    clampCameraPosition()
  }

  const handlePointerUp = (e: PointerEvent) => {
    const elapsed = Date.now() - pointerDownTime

    // If it was a quick tap without movement, check for sprite click
    if (elapsed < TAP_THRESHOLD && !pointerMoved) {
      checkSpriteTap(e.clientX, e.clientY)
    }

    isPanning = false
    canvasContainer.value?.releasePointerCapture(e.pointerId)
  }

  const updateCameraZoom = () => {
    const w = canvasContainer.value!.clientWidth
    const h = canvasContainer.value!.clientHeight
    const aspect = w / h
    const size = frustumSize * currentZoom

    camera.left = (size * aspect) / -2
    camera.right = (size * aspect) / 2
    camera.top = size / 2
    camera.bottom = size / -2
    camera.updateProjectionMatrix()

    clampCameraPosition()
  }

  // Touch handlers
  const getTouchDistance = (touches: TouchList) => {
    const dx = touches[0].clientX - touches[1].clientX
    const dy = touches[0].clientY - touches[1].clientY
    return Math.sqrt(dx * dx + dy * dy)
  }

  const handleTouchStart = (e: TouchEvent) => {
    e.preventDefault()

    if (e.touches.length === 2) {
      initialPinchDistance = getTouchDistance(e.touches)
      initialZoom = currentZoom
      isTouchPanning = false
    } else if (e.touches.length === 1) {
      isTouchPanning = true
      touchStartX = e.touches[0].clientX
      touchStartY = e.touches[0].clientY
      cameraStartX = camera.position.x
      cameraStartY = camera.position.y
    }
  }

  const handleTouchMove = (e: TouchEvent) => {
    e.preventDefault()

    if (e.touches.length === 2 && initialPinchDistance > 0) {
      const currentDistance = getTouchDistance(e.touches)
      const scale = currentDistance / initialPinchDistance
      currentZoom = initialZoom / scale
      currentZoom = Math.max(MAX_ZOOM_IN, Math.min(MAX_ZOOM_OUT, currentZoom))
      updateCameraZoom()
    } else if (e.touches.length === 1 && isTouchPanning) {
      const deltaX = e.touches[0].clientX - touchStartX
      const deltaY = e.touches[0].clientY - touchStartY
      const worldUnitsPerPixel = (frustumSize * currentZoom) / canvasContainer.value!.clientHeight

      camera.position.x = cameraStartX - deltaX * worldUnitsPerPixel
      camera.position.y = cameraStartY + deltaY * worldUnitsPerPixel

      clampCameraPosition()
    }
  }

  const handleTouchEnd = (e: TouchEvent) => {
    if (e.touches.length < 2) {
      initialPinchDistance = 0
    }
    if (e.touches.length === 0) {
      isTouchPanning = false
    }
  }

  // Add event listeners
  canvasContainer.value.addEventListener('wheel', handleWheel, { passive: false })
  canvasContainer.value.addEventListener('pointerdown', handlePointerDown)
  canvasContainer.value.addEventListener('pointermove', handlePointerMove)
  canvasContainer.value.addEventListener('pointerup', handlePointerUp)
  canvasContainer.value.addEventListener('pointerleave', handlePointerUp)
  canvasContainer.value.addEventListener('touchstart', handleTouchStart, { passive: false })
  canvasContainer.value.addEventListener('touchmove', handleTouchMove, { passive: false })
  canvasContainer.value.addEventListener('touchend', handleTouchEnd)

  // Animation loop
  const animate = (time: number) => {
    animationFrameId = requestAnimationFrame(animate)

    animatedSprites.forEach((sprite) => {
      updateSpriteAnimation(sprite, time)
    })

    // Animate fog clouds - slow gentle drifting across the field
    const fogClouds = (window as any).__fogClouds as THREE.Sprite[] | undefined
    if (fogClouds) {
      fogClouds.forEach((cloud) => {
        const data = cloud.userData
        const t = time + data.offset
        // Very slow, smooth drifting motion
        cloud.position.x = data.baseX + Math.sin(t * data.speed) * data.driftX
        cloud.position.y = data.baseY + Math.cos(t * data.speed * 0.6) * data.driftY
        // Subtle opacity breathing - matching new visibility level
        const mat = cloud.material as THREE.SpriteMaterial
        mat.opacity = 0.18 + Math.sin(t * data.speed * 0.3) * 0.07
      })
    }

    renderer.render(scene, camera)
  }
  animate(0)

  // Handle resize
  const handleResize = () => {
    if (!canvasContainer.value) return
    updateCameraZoom()
    renderer.setSize(canvasContainer.value.clientWidth, canvasContainer.value.clientHeight)
  }
  window.addEventListener('resize', handleResize)
}

// Task completion check interval
let taskCheckInterval: ReturnType<typeof setInterval> | null = null

onMounted(async () => {
  // Ensure club data is loaded
  if (!clubStore.hasClub) {
    await clubStore.fetchClub()
  }

  // If still no club, show creation UI
  if (!clubStore.hasClub) {
    needsClubCreation.value = true
    isInitializing.value = false
    return
  }

  // Fetch training options
  clubStore.fetchTrainingOptions()

  // Initialize scene
  initScene()

  // Set up task completion checker
  taskCheckInterval = setInterval(() => {
    clubStore.checkCompletedTasks()
  }, 1000)
})

onUnmounted(() => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
  }
  if (renderer) {
    renderer.dispose()
  }
  if (taskCheckInterval) {
    clearInterval(taskCheckInterval)
  }
})

// Computed: club info for header
const clubInfo = computed(() => ({
  name: clubStore.clubName,
  level: clubStore.clubLevel,
  fans: clubStore.clubFans,
  avgEnergy: clubStore.teamAverageEnergy
}))
</script>

<template>
  <div class="min-h-screen w-full bg-[#0a0812] relative overflow-hidden">
    <!-- Loading overlay - MV3 Style -->
    <div v-if="isInitializing" class="absolute inset-0 z-50 flex items-center justify-center bg-[#0a0812]">
      <Loader variant="game" title="Loading Field" subtitle="Preparing your stadium..." />
    </div>

    <!-- Club Creation UI - MV3 Style -->
    <div v-else-if="needsClubCreation" class="absolute inset-0 z-50 flex items-center justify-center bg-[#0a0812] p-4">
      <div class="max-w-md w-full space-y-8">
        <!-- Header -->
        <div class="text-center space-y-4">
          <div class="w-16 h-16 mx-auto border border-white/20 flex items-center justify-center">
            <Trophy class="w-8 h-8 text-[#4fd4d4]" />
          </div>
          <h1 class="text-white uppercase tracking-widest text-sm font-medium">Create Your Club</h1>
          <p class="text-white/40 text-sm">
            Start your journey by creating your football club. You'll receive 6 beginner players to start with!
          </p>
        </div>

        <!-- Separator -->
        <div class="h-[1px] w-full bg-white/10" />

        <!-- Form -->
        <div class="space-y-6">
          <div>
            <Input
              v-model="clubName"
              variant="game"
              placeholder="Enter club name..."
              class="text-center"
              :disabled="clubStore.loading.club"
              @keyup.enter="handleCreateClub"
            />
            <p v-if="createError" class="text-sm text-rose-400 mt-2 text-center">
              {{ createError }}
            </p>
          </div>

          <Button
            @click="handleCreateClub"
            variant="game-primary"
            size="game-lg"
            class="w-full gap-2"
            :disabled="clubStore.loading.club || !clubName.trim()"
          >
            <Loader2 v-if="clubStore.loading.club" class="w-4 h-4 animate-spin" />
            <Plus v-else class="w-4 h-4" />
            Create Club
          </Button>
        </div>

        <!-- Separator -->
        <div class="h-[1px] w-full bg-white/10" />

        <!-- Info -->
        <div class="text-center space-y-3">
          <p class="text-white/50 uppercase tracking-widest text-xs">Your starter squad includes</p>
          <ul class="space-y-1 text-white/40 text-sm">
            <li>1 Goalkeeper</li>
            <li>5 Outfield players</li>
            <li>All with 100% energy</li>
            <li>Ready for training!</li>
          </ul>
        </div>

        <Button @click="goBack" variant="game-ghost" size="game" class="w-full gap-2">
          <ArrowLeft class="w-4 h-4" />
          Back
        </Button>
      </div>
    </div>

    <!-- Back button & Club Info - MV3 Style -->
    <div class="absolute top-4 left-4 z-20 flex items-center gap-4">
      <Button
        @click="goBack"
        variant="game-icon"
        size="game-icon"
        class="w-10 h-10 border border-white/10 hover:border-[#4fd4d4]/50"
      >
        <ArrowLeft class="w-5 h-5" />
      </Button>

      <!-- Club info badge - MV3 minimal -->
      <div class="border border-white/10 px-4 py-2">
        <div class="text-white text-xs font-medium tracking-wider uppercase">{{ clubInfo.name }}</div>
        <div class="flex items-center gap-3 text-white/50 text-[10px] tracking-wide mt-1">
          <span>LV.{{ clubInfo.level }}</span>
          <span class="text-white/20">·</span>
          <span>{{ clubInfo.fans }} FANS</span>
          <span class="text-white/20">·</span>
          <span :class="clubInfo.avgEnergy >= 40 ? 'text-[#4fd4d4]' : 'text-rose-400'" class="flex items-center gap-1">
            <Zap class="w-3 h-3" /> {{ clubInfo.avgEnergy }}%
          </span>
        </div>
      </div>
    </div>

    <!-- Success message - MV3 Style -->
    <div v-if="actionSuccess" class="absolute top-4 left-1/2 -translate-x-1/2 z-30 px-4 py-2 border border-[#4fd4d4]/30 bg-[#4fd4d4]/10 text-[#4fd4d4] text-xs tracking-wide uppercase">
      {{ actionSuccess }}
    </div>

    <!-- Hint text - MV3 Style -->
    <div v-if="!isInitializing && !needsClubCreation && clubStore.hasClub" class="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
      <div class="border border-white/10 text-white/40 text-[10px] tracking-wider uppercase px-4 py-2">
        Tap on a player to interact
      </div>
    </div>

    <!-- Three.js Canvas -->
    <div
      ref="canvasContainer"
      class="w-full h-screen cursor-grab active:cursor-grabbing"
      style="touch-action: none"
    ></div>


    <!-- Player Dialog - Monument Valley 3 Style -->
    <Dialog v-model:open="showPlayerDialog">
      <DialogContent variant="game" class="max-w-sm">
        <div v-if="selectedPlayer" class="space-y-6 text-center">
          <!-- Position Badge Header -->
          <div class="flex justify-center">
            <PositionBadge :position="selectedPlayer.position" />
          </div>

          <!-- Horizontal line separator -->
          <div class="h-[1px] w-full bg-white/10" />

          <!-- Level & XP -->
          <p class="text-sm text-white/40 tracking-widest uppercase">
            Level {{ selectedPlayer.level }} · {{ selectedPlayer.xp }} XP
          </p>

          <!-- Energy Bar -->
          <EnergyBar :value="selectedPlayer.energy" />

          <!-- Stats Grid -->
          <div class="grid grid-cols-4 gap-4">
            <StatBox stat="stamina" :value="selectedPlayer.stamina" />
            <StatBox stat="strength" :value="selectedPlayer.strength" />
            <StatBox stat="awareness" :value="selectedPlayer.awareness" />
            <StatBox stat="finishing" :value="selectedPlayer.finishing" />
          </div>

          <!-- Horizontal line separator -->
          <div class="h-[1px] w-full bg-white/10" />

          <!-- Current Task -->
          <div v-if="selectedPlayer.current_task" class="flex items-center justify-center gap-3">
            <Clock class="w-4 h-4 text-[#4fd4d4] animate-pulse" />
            <span class="capitalize text-white/70 text-sm tracking-wide">{{ selectedPlayer.current_task }}</span>
            <span class="text-sm text-[#4fd4d4]">
              {{ formatTimeLeft(selectedPlayer.task_ends_at) }}
            </span>
          </div>

          <!-- Action Buttons - MV3 Style -->
          <div v-else class="flex items-center justify-center gap-8 py-2">
            <Button @click="openTrainDialog" variant="game-primary" size="game" class="flex-col gap-1">
              <Dumbbell class="w-5 h-5" />
              <span class="text-[10px]">Train</span>
            </Button>
            <Button @click="handleFeed" variant="game" size="game" class="flex-col gap-1" :disabled="clubStore.loading.feed">
              <Loader2 v-if="clubStore.loading.feed" class="w-5 h-5 animate-spin" />
              <Utensils v-else class="w-5 h-5" />
              <span class="text-[10px]">Feed</span>
            </Button>
            <Button @click="handleRest('short')" variant="game" size="game" class="flex-col gap-1" :disabled="clubStore.loading.rest">
              <Loader2 v-if="clubStore.loading.rest" class="w-5 h-5 animate-spin" />
              <BedDouble v-else class="w-5 h-5" />
              <span class="text-[10px]">Rest</span>
            </Button>
          </div>

          <!-- Error message -->
          <p v-if="actionError" class="text-sm text-rose-400">{{ actionError }}</p>
        </div>
      </DialogContent>
    </Dialog>

    <!-- Train Dialog - MV3 Style -->
    <Dialog v-model:open="showTrainDialog">
      <DialogContent variant="game" class="max-w-sm">
        <div class="space-y-6 text-center">
          <!-- Header -->
          <div>
            <h2 class="text-lg font-light text-white tracking-wide">Training</h2>
            <p class="text-xs text-white/40 tracking-widest uppercase mt-1">
              {{ selectedPlayer?.position }}
            </p>
          </div>

          <!-- Horizontal line separator -->
          <div class="h-[1px] w-full bg-white/10" />

          <div v-if="clubStore.loading.trainingOptions" class="py-8 text-center">
            <Loader2 class="w-6 h-6 animate-spin mx-auto mb-2 text-[#4fd4d4]" />
            <p class="text-sm text-white/40">Loading options...</p>
          </div>

          <div v-else class="space-y-4">
            <div
              v-for="option in clubStore.trainingOptions"
              :key="option.type"
              class="group py-3 cursor-pointer transition-colors border-b border-white/5 last:border-0 hover:bg-white/5"
              @click="handleTrain(option.type)"
            >
              <div class="flex items-center justify-between mb-2">
                <span class="font-medium capitalize text-white group-hover:text-[#4fd4d4] transition-colors">{{ option.type }}</span>
                <span class="text-xs text-white/40">{{ Math.round(option.duration / 60) }}min</span>
              </div>
              <p class="text-xs text-white/40 text-left mb-2">{{ option.description }}</p>
              <div class="flex items-center gap-4 text-xs">
                <span class="text-[#4fd4d4]">+{{ option.xp_gain }} XP</span>
                <span v-for="(value, stat) in option.stats" :key="stat" class="text-white/60">
                  +{{ value }} {{ stat }}
                </span>
                <span class="text-white/30">-{{ option.energy_cost }} energy</span>
              </div>
            </div>
          </div>

          <p v-if="actionError" class="text-sm text-rose-400">{{ actionError }}</p>

          <!-- Horizontal line separator -->
          <div class="h-[1px] w-full bg-white/10" />

          <Button variant="game-secondary" size="game" @click="showTrainDialog = false">
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>

<style scoped>
canvas {
  display: block;
}

</style>
