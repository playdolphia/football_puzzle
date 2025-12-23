<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useGlobalStore } from '@/stores'
import { useClubStore } from '@/stores/clubStore'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent
} from '@/components/ui/dialog'
import { ArrowLeft, Dumbbell, Utensils, Zap, Clock, Loader2, Trophy, Plus, BedDouble, Pencil } from 'lucide-vue-next'
import { Input } from '@/components/ui/input'
import { toast } from 'vue-sonner'
import StatBox from '@/components/layouts/StatBox.vue'
import EnergyBar from '@/components/layouts/EnergyBar.vue'
import PositionBadge from '@/components/layouts/PositionBadge.vue'
import Loader from '@/components/layouts/Loader.vue'
import * as THREE from 'three'
import gsap from 'gsap'
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
const showRestDialog = ref(false)
const showRenameDialog = ref(false)
const newClubName = ref('')

// Reactive timer tick for countdown updates
const timerTick = ref(0)
let dialogTimerInterval: ReturnType<typeof setInterval> | null = null

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
  { name: 'Training', path: '/sprites/dolphin_training.png', frames: 4, state: 'training' },
  { name: 'Defeated', path: '/sprites/dolphin_defeated.png', frames: 12, state: 'tired' },
  { name: 'Resting', path: '/sprites/dolphin_rest.png', frames: 4, state: 'resting' },
  { name: 'Feeding', path: '/sprites/dolphin_feeding.png', frames: 4, state: 'feeding' }
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
  glowMesh?: THREE.Mesh // Glow effect for match state
  hoverOverlay?: THREE.Mesh // Dark overlay for hover state
  isHovered: boolean // Track hover state
  hoverOpacity: number // Current hover overlay opacity (for smooth transition)
  targetHoverOpacity: number // Target hover overlay opacity
}
const animatedSprites: AnimatedSprite[] = []

// Track currently hovered sprite for cursor changes
let hoveredSprite: AnimatedSprite | null = null

// Create glow texture for match state
const createGlowTexture = (): THREE.CanvasTexture => {
  const canvas = document.createElement('canvas')
  const size = 256
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!

  // Create radial gradient glow - cyan/teal color matching the UI
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  gradient.addColorStop(0, 'rgba(79, 212, 212, 0.6)')   // #4fd4d4 - bright center
  gradient.addColorStop(0.3, 'rgba(79, 212, 212, 0.3)')
  gradient.addColorStop(0.6, 'rgba(79, 212, 212, 0.1)')
  gradient.addColorStop(1, 'rgba(79, 212, 212, 0)')

  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)

  return new THREE.CanvasTexture(canvas)
}

// Add glow effect to a sprite (for match state)
const addGlowToSprite = (sprite: AnimatedSprite) => {
  if (sprite.glowMesh) return // Already has glow

  const glowTexture = createGlowTexture()
  const glowSize = spriteSize * 1.8 // Larger than sprite for glow effect
  const glowGeometry = new THREE.PlaneGeometry(glowSize, glowSize)
  const glowMaterial = new THREE.MeshBasicMaterial({
    map: glowTexture,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  })

  const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial)
  glowMesh.position.set(sprite.position.x, sprite.position.y, sprite.position.z - 0.1) // Behind sprite
  scene.add(glowMesh)
  sprite.glowMesh = glowMesh
}

// Remove glow effect from a sprite
const removeGlowFromSprite = (sprite: AnimatedSprite) => {
  if (!sprite.glowMesh) return

  scene.remove(sprite.glowMesh)
  sprite.glowMesh.geometry.dispose()
  ;(sprite.glowMesh.material as THREE.MeshBasicMaterial).dispose()
  sprite.glowMesh = undefined
}

// Ensure hover overlay exists for a sprite (created once, opacity animated)
const ensureHoverOverlay = (sprite: AnimatedSprite) => {
  if (sprite.hoverOverlay) return // Already has overlay

  // Clone the sprite's texture for the overlay
  const spriteMaterial = sprite.mesh.material as THREE.MeshBasicMaterial
  if (!spriteMaterial.map) return

  const overlayTexture = spriteMaterial.map.clone()
  overlayTexture.needsUpdate = true

  // Get the sprite's current geometry dimensions
  const spriteGeom = sprite.mesh.geometry as THREE.PlaneGeometry
  const params = spriteGeom.parameters
  const overlayGeometry = new THREE.PlaneGeometry(params.width, params.height)

  // Use multiply blending to darken the sprite - start with 0 opacity
  const overlayMaterial = new THREE.MeshBasicMaterial({
    map: overlayTexture,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    color: 0x333333 // Dark tint applied to texture
  })

  const overlayMesh = new THREE.Mesh(overlayGeometry, overlayMaterial)
  overlayMesh.position.set(sprite.position.x, sprite.position.y, sprite.position.z + 0.05) // Slightly in front
  if (sprite.flipX) {
    overlayMesh.scale.x = -1
  }
  scene.add(overlayMesh)
  sprite.hoverOverlay = overlayMesh
}

// Set target hover opacity (will animate smoothly in render loop)
const setHoverTarget = (sprite: AnimatedSprite, hovered: boolean) => {
  sprite.targetHoverOpacity = hovered ? 0.5 : 0
}

// Check for sprite hover (called on pointer move)
const checkSpriteHover = (clientX: number, clientY: number) => {
  if (!canvasContainer.value || !raycaster || !pointer) return

  const rect = canvasContainer.value.getBoundingClientRect()
  pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1
  pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1

  raycaster.setFromCamera(pointer, camera)

  // Get all dolphin meshes that have player IDs
  const dolphinMeshes = animatedSprites
    .filter(s => s.team === 'dolphin' && s.playerId !== undefined)
    .map(s => s.mesh)

  const intersects = raycaster.intersectObjects(dolphinMeshes)

  // Find the sprite being hovered
  let newHoveredSprite: AnimatedSprite | null = null
  if (intersects.length > 0) {
    const hoveredMesh = intersects[0].object
    newHoveredSprite = animatedSprites.find(s => s.mesh === hoveredMesh) || null
  }

  // Update hover states
  if (newHoveredSprite !== hoveredSprite) {
    // Fade out previous sprite
    if (hoveredSprite) {
      hoveredSprite.isHovered = false
      setHoverTarget(hoveredSprite, false)
    }

    // Fade in new sprite
    if (newHoveredSprite && newHoveredSprite.team === 'dolphin') {
      newHoveredSprite.isHovered = true
      ensureHoverOverlay(newHoveredSprite)
      setHoverTarget(newHoveredSprite, true)
    }

    hoveredSprite = newHoveredSprite

    // Update cursor
    if (canvasContainer.value) {
      canvasContainer.value.style.cursor = newHoveredSprite ? 'pointer' : 'grab'
    }
  }
}

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

// Open rename dialog
const openRenameDialog = () => {
  newClubName.value = clubStore.clubName
  showRenameDialog.value = true
}

// Handle rename club
const handleRenameClub = async () => {
  if (!newClubName.value.trim()) {
    toast.error('Please enter a club name')
    return
  }

  const result = await clubStore.updateClubName(newClubName.value.trim())

  if (result.ok) {
    showRenameDialog.value = false
    toast.success('Club name updated!')
  } else {
    toast.error(result.message || 'Failed to update club name')
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

// Parse task_ends_at timestamp - server returns UTC times without 'Z' suffix
const parseTaskEndTime = (taskEndsAt: string): Date => {
  // If the timestamp doesn't have timezone info, treat it as UTC
  if (!taskEndsAt.includes('Z') && !taskEndsAt.includes('+')) {
    return new Date(taskEndsAt.replace(' ', 'T') + 'Z')
  }
  return new Date(taskEndsAt)
}

// Check if a task has expired
const isTaskExpiredCheck = (taskEndsAt: string | null): boolean => {
  if (!taskEndsAt) return false
  const endTime = parseTaskEndTime(taskEndsAt)
  return endTime <= new Date()
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
    // Resting: use dolphin_rest.png, hold on last frame
    const restAnim = anims.find(a => a.state === 'resting') || anims[0]
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

// Drop animation constants
const DROP_DISTANCE = 6 // How far above to start
const FIELD_DROP_DURATION = 0.8
const FIELD_DROP_DELAY = 0.2
const CHARACTER_DROP_DELAY = FIELD_DROP_DELAY + FIELD_DROP_DURATION - 0.3 // Start slightly before field lands
const CHARACTER_DROP_DURATION = 0.6
const GOAL_DROP_DELAY = CHARACTER_DROP_DELAY + 0.4 // Start after some characters have landed
const GOAL_DROP_DURATION = 0.5

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
  startAtLastFrame: boolean = false, // When true, start at last frame (for existing tasks on page load)
  dropAnimationDelay: number = 0 // Delay before drop animation starts
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

      const geometry = new THREE.PlaneGeometry(size * frameAspect, size)
      const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        side: THREE.DoubleSide
      })

      const mesh = new THREE.Mesh(geometry, material)

      // Start above final position for drop animation
      mesh.position.set(position.x, position.y + DROP_DISTANCE, position.z)

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
        // Bots should start with animation complete (stay at frame 0)
        // Dolphins play their idle animation normally, or start complete if at last frame
        animationComplete: team === 'bot' ? true : startAtLastFrame,
        isReversing: false,
        holdOnLastFrame,
        playerId,
        looping,
        currentAnimState: animState,
        isHovered: false,
        hoverOpacity: 0,
        targetHoverOpacity: 0
      }

      // Animate drop with bounce
      gsap.to(mesh.position, {
        y: position.y,
        duration: CHARACTER_DROP_DURATION,
        ease: 'bounce.out',
        delay: dropAnimationDelay
      })

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
    console.log(`[updateSpriteTexture] Starting reverse animation from frame ${sprite.currentFrame}`)
    sprite.isReversing = true
    sprite.animationComplete = false
    sprite.holdOnLastFrame = false
    sprite.looping = false
    // Mark as transitioning to idle so subsequent watcher triggers don't overwrite
    // We use a special state to indicate "reversing to idle"
    sprite.currentAnimState = 'idle' // Set to idle immediately to prevent re-triggering
    // Will reverse from current frame back to 0, then load idle animation
    return
  }

  // Set currentAnimState IMMEDIATELY to prevent race condition
  // where watcher triggers again before texture loads
  sprite.currentAnimState = newAnimState

  // Also set holdOnLastFrame immediately so the animation logic knows what to do
  sprite.holdOnLastFrame = holdOnLastFrame
  sprite.looping = looping
  sprite.animationComplete = false
  sprite.isReversing = false

  console.log(`[updateSpriteTexture] Loading ${texturePath} for state '${newAnimState}', frames: ${frameCount}, holdOnLastFrame: ${holdOnLastFrame}`)

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
    // Restore normal frame time (in case it was slowed for bot random animations)
    sprite.frameTime = 50
    // Use performance.now() to sync with animation loop timing
    sprite.lastFrameTime = performance.now()

    // Make sprite visible again (in case it was hidden during texture swap)
    sprite.mesh.visible = true

    console.log(`[updateSpriteTexture] Texture loaded for state '${newAnimState}', starting at frame 0`)
  })
}

// Update animations based on player states
const updatePlayerAnimations = () => {
  console.log('[updatePlayerAnimations] Called, processing', clubStore.players.length, 'players')
  clubStore.players.forEach((player) => {
    const sprite = animatedSprites.find(s => s.playerId === player.id)
    if (!sprite) {
      console.log(`[updatePlayerAnimations] Player ${player.id}: No sprite found`)
      return
    }

    const prevState = previousPlayerStates.get(player.id)

    // Check if task is expired and use effective task for animation
    const isTaskExpired = isTaskExpiredCheck(player.task_ends_at)
    const effectiveTask = isTaskExpired ? null : player.current_task
    const playerForAnim = { ...player, current_task: effectiveTask }

    const animConfig = getAnimationForPlayerState(playerForAnim, 'dolphin')

    console.log(`[updatePlayerAnimations] Player ${player.id}: task=${player.current_task}, effectiveTask=${effectiveTask}, spriteState=${sprite.currentAnimState}, targetState=${animConfig.state}`)

    // Check if a timed task just completed (had active task, now doesn't)
    // Use hasActiveTask to properly detect rest:* format tasks
    const hadActiveTask = prevState?.task && hasActiveTask(prevState.task)
    const nowHasActiveTask = hasActiveTask(effectiveTask)
    const taskJustCompleted = hadActiveTask && !nowHasActiveTask

    // Check if this is the first time we're seeing this player (no previous state)
    // In that case, don't do anything - the sprite was already created with correct state
    const isFirstUpdate = !prevState
    if (isFirstUpdate) {
      // Just record the state for future comparisons, don't change the sprite
      previousPlayerStates.set(player.id, {
        task: effectiveTask,
        taskEndsAt: isTaskExpired ? null : player.task_ends_at
      })
      return
    }

    // Update previous state tracking with effective task (respecting expiry)
    previousPlayerStates.set(player.id, {
      task: effectiveTask,
      taskEndsAt: isTaskExpired ? null : player.task_ends_at
    })

    // If task just completed, handle the transition back to idle
    if (taskJustCompleted) {
      // If sprite is on last frame of a holdOnLastFrame animation, reverse it
      if (sprite.holdOnLastFrame && sprite.currentFrame > 0) {
        console.log(`[updatePlayerAnimations] Player ${player.id}: Task completed, reversing from frame ${sprite.currentFrame}`)
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
      } else {
        // Task completed but animation wasn't holding (or was at frame 0)
        // Just switch to idle immediately
        console.log(`[updatePlayerAnimations] Player ${player.id}: Task completed, switching to idle (frame was ${sprite.currentFrame}, holdOnLastFrame: ${sprite.holdOnLastFrame})`)
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
    } else if (sprite.currentAnimState !== animConfig.state) {
      console.log(`[updatePlayerAnimations] Player ${player.id}: State changed from '${sprite.currentAnimState}' to '${animConfig.state}', loading new animation`)
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

    // Handle glow effect for match state (only if not expired)
    if (effectiveTask === 'match') {
      addGlowToSprite(sprite)
    } else {
      removeGlowFromSprite(sprite)
    }
  })
}

// Watch for player dialog open/close to manage timer
watch(showPlayerDialog, (isOpen) => {
  if (isOpen && selectedPlayer.value?.current_task) {
    startDialogTimer()
  } else {
    stopDialogTimer()
  }
})

// Keep selectedPlayer in sync with store updates (for real-time task completion)
watch(
  () => clubStore.players,
  (players) => {
    if (selectedPlayer.value) {
      const updated = players.find(p => p.id === selectedPlayer.value!.id)
      if (updated) {
        selectedPlayer.value = updated
        // Start/stop timer based on task status
        if (updated.current_task && showPlayerDialog.value) {
          startDialogTimer()
        } else {
          stopDialogTimer()
        }
      }
    }
  },
  { deep: true }
)

// Track if bots are currently visible (for match animation)
let botsVisible = false
let botHideTimeout: ReturnType<typeof setTimeout> | null = null

// Show bots with drop animation
const showBotsWithAnimation = () => {
  if (botsVisible) return
  botsVisible = true

  animatedSprites
    .filter(s => s.team === 'bot')
    .forEach((bot, index) => {
      // Make visible and position above
      bot.mesh.visible = true
      bot.mesh.position.y = bot.position.y + DROP_DISTANCE

      // Animate drop with staggered delay
      gsap.to(bot.mesh.position, {
        y: bot.position.y,
        duration: CHARACTER_DROP_DURATION,
        ease: 'bounce.out',
        delay: index * 0.08
      })
    })
}

// Hide bots with reverse animation (go back up)
const hideBotsWithAnimation = () => {
  if (!botsVisible) return
  botsVisible = false

  animatedSprites
    .filter(s => s.team === 'bot')
    .forEach((bot, index) => {
      // Animate going back up
      gsap.to(bot.mesh.position, {
        y: bot.position.y + DROP_DISTANCE,
        duration: 0.5,
        ease: 'power2.in',
        delay: index * 0.05,
        onComplete: () => {
          bot.mesh.visible = false
        }
      })
    })
}

// Hide bots initially (they show only during match)
const hideBots = () => {
  animatedSprites
    .filter(s => s.team === 'bot')
    .forEach(bot => {
      bot.mesh.visible = false
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

        // Load idle animation now that reverse is complete
        console.log(`[updateSpriteAnimation] Reverse complete, loading idle animation for ${sprite.team} ${sprite.playerId || ''}`)
        const idleAnim = sprite.team === 'dolphin' ? dolphinAnimations[0] : botAnimations[0]
        if (textureLoaderRef) {
          // For bots, hide sprite during texture load to prevent visual glitch
          if (sprite.team === 'bot') {
            sprite.mesh.visible = false
          }
          updateSpriteTexture(
            sprite,
            idleAnim.path,
            idleAnim.frames,
            textureLoaderRef,
            false, // looping
            false, // holdOnLastFrame
            'idle',
            false  // shouldReverse
          )
        }
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
          // Hold on last frame - mark as complete but stay on this frame
          sprite.animationComplete = true
          console.log(`[updateSpriteAnimation] Holding on last frame ${sprite.currentFrame} of ${sprite.currentAnimState}`)
          return
        } else {
          // Animation reached the end
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

  if (clubStore.trainingOptions.length === 0) {
    clubStore.fetchTrainingOptions()
  }
}

// Train player
const handleTrain = async (type: 'light' | 'balanced' | 'conditioning' | 'finishing') => {
  if (!selectedPlayer.value) return

  const result = await clubStore.trainPlayer(selectedPlayer.value.id, type)

  if (result.ok) {
    showTrainDialog.value = false
    selectedPlayer.value = null
    toast.success('Training started!')
    // Trigger animation update after Vue processes the state change
    await nextTick()
    updatePlayerAnimations()
  } else {
    toast.error(result.message || 'Failed to start training')
  }
}

// Trigger a quick animation for instant actions (like feeding)
const triggerInstantAnimation = (playerId: number) => {
  const sprite = animatedSprites.find(s => s.playerId === playerId)
  if (!sprite) {
    console.log(`[triggerInstantAnimation] No sprite found for player ${playerId}`)
    return
  }

  console.log(`[triggerInstantAnimation] Triggering feeding animation for player ${playerId}`)

  // For feeding: play forward, hold on last frame for 3s, then reset to idle
  const feedAnim = dolphinAnimations.find(a => a.state === 'feeding') || dolphinAnimations[0]

  // Load the animation
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
    sprite.holdOnLastFrame = true // Hold on last frame
    sprite.looping = false
    sprite.lastFrameTime = performance.now()
    sprite.currentAnimState = 'feeding'

    console.log(`[triggerInstantAnimation] Loaded feeding texture, will hold for 3s then reset`)

    // After animation plays forward and holds for 3 seconds, reset to idle
    const animDuration = feedAnim.frames * sprite.frameTime
    const holdDuration = 3000 // 3 seconds

    setTimeout(() => {
      if (sprite.currentAnimState === 'feeding') {
        console.log(`[triggerInstantAnimation] Resetting player ${playerId} to idle after feeding`)
        // Load idle animation
        const idleAnim = dolphinAnimations[0]
        updateSpriteTexture(
          sprite,
          idleAnim.path,
          idleAnim.frames,
          textureLoaderRef,
          false, // looping
          false, // holdOnLastFrame
          'idle',
          false // shouldReverse
        )
      }
    }, animDuration + holdDuration)
  })
}

// Feed player
const handleFeed = async () => {
  if (!selectedPlayer.value) return

  const playerId = selectedPlayer.value.id
  const result = await clubStore.feedPlayers([playerId])

  if (result.ok) {
    showPlayerDialog.value = false
    // Trigger feeding animation
    triggerInstantAnimation(playerId)
    selectedPlayer.value = null
    toast.success('Player fed!')
  } else {
    toast.error(result.message || 'Failed to feed player')
  }
}

// Open rest dialog
const openRestDialog = () => {
  showPlayerDialog.value = false
  showRestDialog.value = true
}

// Rest player
const handleRest = async (type: 'short' | 'full') => {
  if (!selectedPlayer.value) return

  const result = await clubStore.restPlayer(selectedPlayer.value.id, type)

  if (result.ok) {
    showRestDialog.value = false
    selectedPlayer.value = null
    toast.success('Player is now resting!')
    // Trigger animation update after Vue processes the state change
    await nextTick()
    updatePlayerAnimations()
  } else {
    toast.error(result.message || 'Failed to rest player')
  }
}

// Play bot match
const handlePlayBotMatch = async () => {
  // Clear any pending hide timeout
  if (botHideTimeout) {
    clearTimeout(botHideTimeout)
    botHideTimeout = null
  }

  // Show bots with drop animation
  showBotsWithAnimation()

  const result = await clubStore.playBotMatch()

  if (result.ok && result.data) {
    const matchResult = result.data
    // Show match result
    if (matchResult.result === 'win') {
      toast.success(`Victory! ${matchResult.score.club} - ${matchResult.score.bot}`)
    } else if (matchResult.result === 'loss') {
      toast.error(`Defeat! ${matchResult.score.club} - ${matchResult.score.bot}`)
    } else {
      toast.info(`Draw! ${matchResult.score.club} - ${matchResult.score.bot}`)
    }
    // Trigger animation update
    await nextTick()
    updatePlayerAnimations()

    // Hide bots after 10 seconds with reverse animation
    botHideTimeout = setTimeout(() => {
      hideBotsWithAnimation()
    }, 10000)
  } else {
    toast.error(result.message || 'Failed to start match')
    // Hide bots immediately on error
    hideBotsWithAnimation()
  }
}

// Format task name for display (converts "rest:short:15:0" to "Resting")
const formatTaskName = (task: string | null): string => {
  if (!task) return ''
  if (task === 'training') return 'Training'
  if (task === 'match') return 'In Match'
  if (task.startsWith('rest:')) return 'Resting'
  return task.charAt(0).toUpperCase() + task.slice(1)
}

// Format time remaining (uses timerTick for reactivity)
const formatTimeLeft = (taskEndsAt: string | null): string => {
  // Reference timerTick to make this reactive
  void timerTick.value

  if (!taskEndsAt) return ''
  // Use parseTaskEndTime to handle UTC timestamps correctly
  const endTime = parseTaskEndTime(taskEndsAt).getTime()
  const now = Date.now()
  const diff = endTime - now

  if (diff <= 0) return 'Completing...'

  const hours = Math.floor(diff / 3600000)
  const minutes = Math.floor((diff % 3600000) / 60000)
  const seconds = Math.floor((diff % 60000) / 1000)

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`
  }
  return `${seconds}s`
}

// Start timer interval when dialog opens with active task
const startDialogTimer = () => {
  if (dialogTimerInterval) return
  dialogTimerInterval = setInterval(() => {
    timerTick.value++
  }, 1000)
}

// Stop timer interval when dialog closes
const stopDialogTimer = () => {
  if (dialogTimerInterval) {
    clearInterval(dialogTimerInterval)
    dialogTimerInterval = null
  }
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

    // Start field above screen for drop animation
    const dropDistance = 8 // How far above to start
    plane.position.y = dropDistance
    scene.add(plane)

    // Animate field dropping in with bounce
    gsap.to(plane.position, {
      y: 0,
      duration: 0.8,
      ease: 'bounce.out',
      delay: 0.2
    })

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
      }

      // Check if task is already expired - if so, treat as idle
      // This prevents showing task animation briefly before reverting to idle
      const isTaskExpired = isTaskExpiredCheck(player?.task_ends_at ?? null)
      const effectiveTask = isTaskExpired ? null : player?.current_task

      // Create a modified player object for animation config if task is expired
      const playerForAnim = player ? { ...player, current_task: effectiveTask ?? null } : null

      const animConfig = playerForAnim
        ? getAnimationForPlayerState(playerForAnim, 'dolphin')
        : { path: dolphinAnimations[0].path, frames: dolphinAnimations[0].frames, looping: false, holdOnLastFrame: false, state: 'idle' as AnimState }

      // If player has an active (non-expired) task, start at last frame
      const playerHasActiveTask = playerForAnim && hasActiveTask(playerForAnim.current_task)
      const shouldStartAtLastFrame = playerHasActiveTask && animConfig.holdOnLastFrame

      // Debug logging
      console.log(`[Dolphin ${pos.role}] Player:`, player?.id, 'Task:', player?.current_task,
        'isExpired:', isTaskExpired, 'effectiveTask:', effectiveTask,
        'hasActiveTask:', playerHasActiveTask, 'shouldStartAtLastFrame:', shouldStartAtLastFrame)

      // Calculate staggered drop delay for this dolphin
      const dolphinIndex = dolphinPositions.indexOf(pos)
      const dolphinDropDelay = CHARACTER_DROP_DELAY + (dolphinIndex * 0.08)

      const dolphinSprite = await createAnimatedSprite(
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
        shouldStartAtLastFrame || false,
        dolphinDropDelay
      )

      // Initialize previousPlayerStates with the EFFECTIVE task (null if expired)
      // This prevents false "task completed" detection
      if (player) {
        previousPlayerStates.set(player.id, {
          task: effectiveTask ?? null,
          taskEndsAt: isTaskExpired ? null : player.task_ends_at
        })
      }

      // Add glow effect if player is in match state (only if not expired)
      if (effectiveTask === 'match') {
        addGlowToSprite(dolphinSprite)
      }
    }

    // Create bots on right side with staggered drop animation
    for (let botIndex = 0; botIndex < botPositions.length; botIndex++) {
      const pos = botPositions[botIndex]
      // Bots start dropping slightly after dolphins
      const botDropDelay = CHARACTER_DROP_DELAY + 0.2 + (botIndex * 0.08)

      await createAnimatedSprite(
        botAnimations[0].path,
        botAnimations[0].frames,
        pos,
        spriteSize,
        textureLoaderRef,
        false,
        'bot',
        undefined,
        false,
        false,
        'idle',
        false,
        botDropDelay
      )
    }

    // Hide bots initially (they only show during match)
    hideBots()

    // Load goal images (z=2 to appear in front of players) with drop animation
    const loadGoal = (path: string, x: number, y: number, height: number, dropDelay: number) => {
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
        // Start above final position for drop animation
        goalMesh.position.set(x, y + DROP_DISTANCE, 2)
        scene.add(goalMesh)

        // Animate drop with bounce
        gsap.to(goalMesh.position, {
          y: y,
          duration: GOAL_DROP_DURATION,
          ease: 'bounce.out',
          delay: dropDelay
        })
      })
    }

    // Left goal (dolphin side) - adjusted position and scale
    loadGoal('/scene/left-goal.webp', -2.15, -0.2, 2, GOAL_DROP_DELAY)
    // Right goal (bot side) - adjusted position and scale with slight stagger
    loadGoal('/scene/right-goal.webp', 2.4, 2.5, 2, GOAL_DROP_DELAY + 0.15)

    // ========== DECORATIVE ELEMENTS (Clouds, Cubes, Geometries) ==========
    // Positions based on screenshot reference (scaled to match Three.js world coordinates)
    // These elements are placed around the field edges for visual appeal

    interface DecorativeElement {
      mesh: THREE.Mesh
      type: 'cloud' | 'geometry'
      baseX: number
      baseY: number
    }
    const decorativeElements: DecorativeElement[] = []

    // Load decorative sprite helper
    const loadDecorativeSprite = (
      path: string,
      x: number,
      y: number,
      z: number,
      height: number,
      type: 'cloud' | 'geometry',
      fadeDelay: number
    ) => {
      textureLoaderRef.load(path, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace
        const aspect = tex.image.width / tex.image.height
        const width = height * aspect
        const geometry = new THREE.PlaneGeometry(width, height)
        const material = new THREE.MeshBasicMaterial({
          map: tex,
          transparent: true,
          opacity: 0, // Start invisible for fade-in
          depthWrite: false
        })
        const mesh = new THREE.Mesh(geometry, material)
        mesh.position.set(x, y, z)
        scene.add(mesh)

        // Store for animation
        decorativeElements.push({ mesh, type, baseX: x, baseY: y })

        // Fade-in animation with GSAP
        gsap.to(material, {
          opacity: 1,
          duration: 1.2,
          ease: 'power2.out',
          delay: fadeDelay
        })
      })
    }

    // Timing for decorative elements (after goals drop)
    const DECOR_FADE_START = GOAL_DROP_DELAY + GOAL_DROP_DURATION

    // === CLOUDS (4 corners) - z=5 to be on top of everything ===
    // Top-left cloud - large, positioned at upper left
    loadDecorativeSprite('/scene/top-left-cloud.webp', -3.8, 2.8, 5, 2.5, 'cloud', DECOR_FADE_START)
    // Top-right cloud - smaller, positioned at upper right
    loadDecorativeSprite('/scene/top-right-cloud.webp', 3.5, 3.2, 5, 1.5, 'cloud', DECOR_FADE_START + 0.1)
    // Bottom-left cloud - medium, positioned at lower left
    loadDecorativeSprite('/scene/bottom-left-cloud.webp', -3.5, -2.5, 5, 2.0, 'cloud', DECOR_FADE_START + 0.2)
    // Bottom-right cloud - large, positioned at lower right
    loadDecorativeSprite('/scene/bottom-right-cloud.webp', 3.2, -2.2, 5, 2.2, 'cloud', DECOR_FADE_START + 0.3)

    // === GEOMETRIC SHAPES (cubes, pyramid, etc.) - z=4 to be on top ===
    // Green quarter-ball - top area
    loadDecorativeSprite('/scene/green-quarter-ball.webp', 1.5, 3.5, 4, 0.6, 'geometry', DECOR_FADE_START + 0.15)
    // Orange cube - left side
    loadDecorativeSprite('/scene/orange-cube.webp', -4.2, 1.5, 4, 0.5, 'geometry', DECOR_FADE_START + 0.25)
    // Pink circle - right side
    loadDecorativeSprite('/scene/pink-circle.webp', 4.0, 1.2, 4, 0.35, 'geometry', DECOR_FADE_START + 0.35)
    // Green cube - right side lower
    loadDecorativeSprite('/scene/green-cube.webp', 4.2, 0.2, 4, 0.6, 'geometry', DECOR_FADE_START + 0.45)
    // Purple pyramid - left side lower
    loadDecorativeSprite('/scene/purple-pyramid.webp', -3.0, -1.0, 4, 0.7, 'geometry', DECOR_FADE_START + 0.4)
    // Purple cube - bottom right
    loadDecorativeSprite('/scene/purple-cube.webp', 3.8, -3.0, 4, 0.5, 'geometry', DECOR_FADE_START + 0.5)

    // Store decorative elements for animation loop
    ;(window as any).__decorativeElements = decorativeElements

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
    // Always check hover for cursor and overlay, even when not panning
    checkSpriteHover(e.clientX, e.clientY)

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

    // Animate glow meshes for match state dolphins - pulsing effect
    // Also animate hover overlay opacity for smooth transitions
    animatedSprites.forEach((sprite) => {
      // Glow animation
      if (sprite.glowMesh) {
        const glowMat = sprite.glowMesh.material as THREE.MeshBasicMaterial
        // Pulse opacity between 0.4 and 1.0
        glowMat.opacity = 0.7 + Math.sin(time * 0.003) * 0.3
        // Subtle scale pulse
        const scale = 1 + Math.sin(time * 0.002) * 0.1
        sprite.glowMesh.scale.set(scale, scale, 1)
      }

      // Smooth hover overlay opacity transition
      if (sprite.hoverOverlay) {
        const lerpSpeed = 0.15 // Adjust for faster/slower transition
        sprite.hoverOpacity += (sprite.targetHoverOpacity - sprite.hoverOpacity) * lerpSpeed

        // Clamp very small values to 0 to avoid floating point issues
        if (Math.abs(sprite.hoverOpacity) < 0.001) {
          sprite.hoverOpacity = 0
        }

        const overlayMat = sprite.hoverOverlay.material as THREE.MeshBasicMaterial
        overlayMat.opacity = sprite.hoverOpacity
      }
    })

    // Animate decorative elements (clouds slide in isometric direction, geometries float)
    const decorElements = (window as any).__decorativeElements as Array<{
      mesh: THREE.Mesh
      type: 'cloud' | 'geometry'
      baseX: number
      baseY: number
    }> | undefined

    if (decorElements) {
      decorElements.forEach((elem, index) => {
        const t = time * 0.001 // Convert to seconds for smoother control

        if (elem.type === 'cloud') {
          // Clouds: sliding in isometric direction (diagonal movement)
          const slideSpeed = 0.15 + index * 0.02
          const slideAmplitude = 0.3 + index * 0.05
          // Isometric sliding: move diagonally
          elem.mesh.position.x = elem.baseX + Math.sin(t * slideSpeed) * slideAmplitude
          elem.mesh.position.y = elem.baseY + Math.cos(t * slideSpeed) * slideAmplitude * 0.5
        } else {
          // Geometries: ultra-smooth floating with gentle bob
          // Very slow speed for peaceful, hypnotic movement
          const floatSpeed = 0.4 + index * 0.08 // Slower base speed
          const floatAmplitude = 0.06 + index * 0.015
          // Smooth sine wave with secondary harmonic for organic motion
          const primaryWave = Math.sin(t * floatSpeed)
          const secondaryWave = Math.sin(t * floatSpeed * 2.1) * 0.15 // Subtle secondary motion
          const combinedWave = primaryWave + secondaryWave
          // Floating motion - primarily vertical with very subtle horizontal sway
          elem.mesh.position.y = elem.baseY + combinedWave * floatAmplitude
          elem.mesh.position.x = elem.baseX + Math.sin(t * floatSpeed * 0.5) * floatAmplitude * 0.2
          // Very subtle scale breathing
          const scaleBreath = 1 + Math.sin(t * floatSpeed * 0.3) * 0.015
          elem.mesh.scale.set(scaleBreath, scaleBreath, 1)
        }
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
let playerSyncInterval: ReturnType<typeof setInterval> | null = null
let botRandomAnimInterval: ReturnType<typeof setInterval> | null = null
const PLAYER_SYNC_INTERVAL = 30000 // Sync player state every 30 seconds
const BOT_RANDOM_ANIM_MIN = 2 * 60 * 1000 // 2 minutes minimum
const BOT_RANDOM_ANIM_MAX = 3 * 60 * 1000 // 3 minutes maximum
const BOT_STATE_DURATION = 15 * 1000 // 15 seconds for testing (should be 15 * 60 * 1000 for production)

// Trigger a random animation on a random bot
const triggerRandomBotAnimation = () => {
  // Get all bot sprites
  const botSprites = animatedSprites.filter(s => s.team === 'bot')
  if (botSprites.length === 0 || !textureLoaderRef) return

  // Pick a random bot that is currently in idle state
  // Skip bots that are already showing a random state or are currently animating
  // The __holdingRandomState flag indicates bot is holding on last frame of a random animation
  const availableBots = botSprites.filter(bot => {
    const hasResetTimer = !!(bot as any).__resetToIdleTimer
    const isHoldingRandomState = !!(bot as any).__holdingRandomState
    const isAnimating = !bot.animationComplete
    const isInRandomState = hasResetTimer || isHoldingRandomState

    // Bot is available if: in idle state, not animating, and not showing a random state
    const available = !isInRandomState && !isAnimating && bot.currentAnimState === 'idle'
    console.log(`[Bot Filter] state=${bot.currentAnimState} animComplete=${bot.animationComplete} hasTimer=${hasResetTimer} holdingState=${isHoldingRandomState} => available=${available}`)
    return available
  })

  if (availableBots.length === 0) {
    console.log(`[Bot Random Anim] No available bots (all busy or in random state)`)
    return
  }

  const randomBot = availableBots[Math.floor(Math.random() * availableBots.length)]

  // Pick a random animation (excluding idle which is index 0)
  const nonIdleAnims = botAnimations.slice(1) // training, tired, defeated
  const randomAnim = nonIdleAnims[Math.floor(Math.random() * nonIdleAnims.length)]

  console.log(`[Bot Random Anim] Triggering ${randomAnim.name} animation on bot`)

  // Hide bot during texture load to prevent visual glitch
  randomBot.mesh.visible = false

  // Load the new animation texture
  textureLoaderRef.load(randomAnim.path, (texture) => {
    texture.colorSpace = THREE.SRGBColorSpace
    texture.magFilter = THREE.LinearFilter
    texture.minFilter = THREE.LinearFilter
    texture.wrapS = THREE.ClampToEdgeWrapping
    texture.wrapT = THREE.ClampToEdgeWrapping

    const sheetWidth = texture.image.width
    const sheetHeight = texture.image.height
    const frameWidth = sheetWidth / randomAnim.frames
    const frameAspect = frameWidth / sheetHeight

    const frameRatio = 1 / randomAnim.frames
    texture.repeat.set(frameRatio * 0.98, 0.98)
    texture.offset.set(0.01 * frameRatio, 0.01)

    const material = randomBot.mesh.material as THREE.MeshBasicMaterial
    material.map?.dispose()
    material.map = texture
    material.needsUpdate = true

    randomBot.mesh.geometry.dispose()
    randomBot.mesh.geometry = new THREE.PlaneGeometry(spriteSize * frameAspect, spriteSize)

    // Set up animation state
    randomBot.frameCount = randomAnim.frames
    randomBot.currentFrame = 0
    randomBot.animationComplete = false
    randomBot.isReversing = false
    randomBot.holdOnLastFrame = true  // Hold on last frame instead of reversing
    randomBot.looping = false
    randomBot.frameTime = 50
    // Use performance.now() to sync with animation loop timing
    // This prevents all frames from advancing instantly due to large time delta
    randomBot.lastFrameTime = performance.now()
    randomBot.currentAnimState = randomAnim.state

    // Mark that this bot is showing a random state (will hold on last frame)
    ;(randomBot as any).__holdingRandomState = true

    // Clear any existing reset timer for this bot
    if ((randomBot as any).__resetToIdleTimer) {
      clearTimeout((randomBot as any).__resetToIdleTimer)
    }

    // Schedule reset to idle after 15 minutes
    ;(randomBot as any).__resetToIdleTimer = setTimeout(() => {
      console.log(`[Bot Random Anim] 15 minutes passed, resetting bot to idle (aggressive)`)
      if (!textureLoaderRef) return

      // Hide during texture load
      randomBot.mesh.visible = false

      // Load idle (aggressive) animation
      const idleAnim = botAnimations[0]
      textureLoaderRef.load(idleAnim.path, (idleTexture) => {
        idleTexture.colorSpace = THREE.SRGBColorSpace
        idleTexture.magFilter = THREE.LinearFilter
        idleTexture.minFilter = THREE.LinearFilter
        idleTexture.wrapS = THREE.ClampToEdgeWrapping
        idleTexture.wrapT = THREE.ClampToEdgeWrapping

        const idleSheetWidth = idleTexture.image.width
        const idleSheetHeight = idleTexture.image.height
        const idleFrameWidth = idleSheetWidth / idleAnim.frames
        const idleFrameAspect = idleFrameWidth / idleSheetHeight

        const idleFrameRatio = 1 / idleAnim.frames
        idleTexture.repeat.set(idleFrameRatio * 0.98, 0.98)
        idleTexture.offset.set(0.01 * idleFrameRatio, 0.01)

        const idleMaterial = randomBot.mesh.material as THREE.MeshBasicMaterial
        idleMaterial.map?.dispose()
        idleMaterial.map = idleTexture
        idleMaterial.needsUpdate = true

        randomBot.mesh.geometry.dispose()
        randomBot.mesh.geometry = new THREE.PlaneGeometry(spriteSize * idleFrameAspect, spriteSize)

        randomBot.frameCount = idleAnim.frames
        randomBot.currentFrame = 0
        randomBot.animationComplete = true
        randomBot.currentAnimState = 'idle'
        randomBot.lastFrameTime = performance.now()

        randomBot.mesh.visible = true
        // Clean up both flags
        delete (randomBot as any).__holdingRandomState
        delete (randomBot as any).__resetToIdleTimer
      })
    }, BOT_STATE_DURATION)

    // Make bot visible now that new texture is loaded
    randomBot.mesh.visible = true

    console.log(`[Bot Random Anim] ${randomAnim.name} texture loaded, will play forward and hold on last frame for ${BOT_STATE_DURATION / 1000}s`)
  })
}

// Schedule next random bot animation with random delay between 2-3 minutes
const scheduleNextBotAnimation = () => {
  const delay = BOT_RANDOM_ANIM_MIN + Math.random() * (BOT_RANDOM_ANIM_MAX - BOT_RANDOM_ANIM_MIN)
  botRandomAnimInterval = setTimeout(() => {
    triggerRandomBotAnimation()
    scheduleNextBotAnimation() // Schedule next one
  }, delay)
}

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

  // Set up task completion checker (runs every second for local task expiry)
  taskCheckInterval = setInterval(() => {
    clubStore.checkCompletedTasks()
  }, 1000)

  // Set up player sync interval (fetches fresh player data from backend)
  playerSyncInterval = setInterval(async () => {
    await clubStore.fetchPlayers()
  }, PLAYER_SYNC_INTERVAL)

  // Start random bot animation scheduler
  scheduleNextBotAnimation()
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
  if (playerSyncInterval) {
    clearInterval(playerSyncInterval)
  }
  if (botRandomAnimInterval) {
    clearTimeout(botRandomAnimInterval)
  }
  if (botHideTimeout) {
    clearTimeout(botHideTimeout)
  }
  // Clean up bot reset timers
  animatedSprites.filter(s => s.team === 'bot').forEach(bot => {
    if ((bot as any).__resetToIdleTimer) {
      clearTimeout((bot as any).__resetToIdleTimer)
    }
  })
  // Clean up dialog timer
  stopDialogTimer()
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
        <button
          @click="openRenameDialog"
          class="flex items-center gap-2 group cursor-pointer"
        >
          <span class="text-white text-xs font-medium tracking-wider uppercase group-hover:text-[#4fd4d4] transition-colors">{{ clubInfo.name }}</span>
          <Pencil class="w-3 h-3 text-white/30 group-hover:text-[#4fd4d4] transition-colors" />
        </button>
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

    <!-- Bottom Actions - MV3 Style -->
    <div v-if="!isInitializing && !needsClubCreation && clubStore.hasClub" class="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-3">
      <Button
        variant="game"
        size="game"
        class="px-8 gap-2"
        :disabled="clubStore.loading.match"
        @click="handlePlayBotMatch"
      >
        <Loader2 v-if="clubStore.loading.match" class="w-4 h-4 animate-spin" />
        <Trophy v-else class="w-4 h-4" />
        <span>Play Match</span>
      </Button>
      <div class="text-white/30 text-[10px] tracking-wider uppercase">
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

          <!-- Current Task with Live Timer (only show if task is not expired) -->
          <div v-if="selectedPlayer.current_task && !isTaskExpiredCheck(selectedPlayer.task_ends_at)" class="space-y-3">
            <div class="flex items-center justify-center gap-3">
              <Clock class="w-4 h-4 text-[#4fd4d4] animate-pulse" />
              <span class="text-white/70 text-sm tracking-wide">{{ formatTaskName(selectedPlayer.current_task) }}</span>
            </div>
            <div class="text-center">
              <span class="text-2xl font-light text-[#4fd4d4] tracking-wider">
                {{ formatTimeLeft(selectedPlayer.task_ends_at) }}
              </span>
            </div>
            <p class="text-xs text-white/30 tracking-wide">
              Player will be available when task completes
            </p>
          </div>

          <!-- Action Buttons - MV3 Style (show if no task or task is expired) -->
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
            <Button @click="openRestDialog" variant="game" size="game" class="flex-col gap-1">
              <BedDouble class="w-5 h-5" />
              <span class="text-[10px]">Rest</span>
            </Button>
          </div>
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

          <!-- Horizontal line separator -->
          <div class="h-[1px] w-full bg-white/10" />

          <Button variant="game-secondary" size="game" @click="showTrainDialog = false">
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    <!-- Rest Dialog - MV3 Style -->
    <Dialog v-model:open="showRestDialog">
      <DialogContent variant="game" class="max-w-sm">
        <div class="space-y-6 text-center">
          <!-- Header -->
          <div>
            <h2 class="text-lg font-light text-white tracking-wide">Rest</h2>
            <p class="text-xs text-white/40 tracking-widest uppercase mt-1">
              {{ selectedPlayer?.position }}
            </p>
          </div>

          <!-- Horizontal line separator -->
          <div class="h-[1px] w-full bg-white/10" />

          <div class="space-y-3">
            <!-- Short Rest Option -->
            <div
              class="group py-4 px-4 cursor-pointer transition-colors border border-white/10 rounded-lg hover:bg-white/5 hover:border-[#4fd4d4]/30"
              @click="handleRest('short')"
            >
              <div class="flex items-center justify-between mb-2">
                <span class="font-medium text-white group-hover:text-[#4fd4d4] transition-colors">Short Rest</span>
                <span class="text-xs text-white/40">15 min</span>
              </div>
              <p class="text-xs text-white/40 text-left">Quick recovery. Restores moderate energy.</p>
              <div class="flex items-center gap-2 mt-2 text-xs">
                <span class="text-green-400">+15 Energy</span>
              </div>
            </div>

            <!-- Full Rest Option -->
            <div
              class="group py-4 px-4 cursor-pointer transition-colors border border-white/10 rounded-lg hover:bg-white/5 hover:border-[#4fd4d4]/30"
              @click="handleRest('full')"
            >
              <div class="flex items-center justify-between mb-2">
                <span class="font-medium text-white group-hover:text-[#4fd4d4] transition-colors">Full Rest</span>
                <span class="text-xs text-white/40">40 min</span>
              </div>
              <p class="text-xs text-white/40 text-left">Complete recovery. Fully restores energy.</p>
              <div class="flex items-center gap-2 mt-2 text-xs">
                <span class="text-green-400">+40 Energy</span>
              </div>
            </div>
          </div>

          <!-- Loading indicator -->
          <div v-if="clubStore.loading.rest" class="flex items-center justify-center gap-2 text-white/60">
            <Loader2 class="w-4 h-4 animate-spin" />
            <span class="text-sm">Starting rest...</span>
          </div>

          <!-- Horizontal line separator -->
          <div class="h-[1px] w-full bg-white/10" />

          <Button variant="game-secondary" size="game" @click="showRestDialog = false">
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    <!-- Rename Club Dialog - MV3 Style -->
    <Dialog v-model:open="showRenameDialog">
      <DialogContent variant="game" class="max-w-sm">
        <div class="space-y-6 text-center">
          <!-- Header -->
          <div>
            <h2 class="text-lg font-light text-white tracking-wide">Rename Club</h2>
            <p class="text-xs text-white/40 tracking-widest uppercase mt-1">
              Enter a new name for your club
            </p>
          </div>

          <!-- Horizontal line separator -->
          <div class="h-[1px] w-full bg-white/10" />

          <!-- Input -->
          <div class="space-y-4">
            <Input
              v-model="newClubName"
              placeholder="Club name..."
              class="bg-transparent border-white/10 text-white text-center placeholder:text-white/30 focus:border-[#4fd4d4]/50"
              maxlength="24"
              @keyup.enter="handleRenameClub"
            />
            <p class="text-xs text-white/30">{{ newClubName.length }}/24 characters</p>
          </div>

          <!-- Horizontal line separator -->
          <div class="h-[1px] w-full bg-white/10" />

          <div class="flex gap-3">
            <Button variant="game-secondary" size="game" class="flex-1" @click="showRenameDialog = false">
              Cancel
            </Button>
            <Button
              variant="game-primary"
              size="game"
              class="flex-1"
              :disabled="clubStore.loading.club || !newClubName.trim()"
              @click="handleRenameClub"
            >
              <Loader2 v-if="clubStore.loading.club" class="w-4 h-4 animate-spin" />
              <span v-else>Save</span>
            </Button>
          </div>
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
