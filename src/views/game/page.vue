<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-vue-next'
import * as THREE from 'three'

const router = useRouter()
const canvasContainer = ref<HTMLDivElement | null>(null)

let camera: THREE.OrthographicCamera
let renderer: THREE.WebGLRenderer
let scene: THREE.Scene
let animationFrameId: number
let textureLoaderRef: THREE.TextureLoader

// Pan and zoom state
let isPanning = false
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
const MAX_ZOOM_IN = 0.2 // Most zoomed in (see less, closer view)
const MAX_ZOOM_OUT = 1 // Most zoomed out (see more, default, prevents seeing outside image)
let currentZoom = MAX_ZOOM_OUT // Start at max zoom out
let frustumSize = 10
let planeWidth = 0
let planeHeight = 0

// Animation options with correct frame counts
const dolphinAnimations = [
  { name: 'Happy', path: '/sprites/dolphin_happy.png', frames: 6 },
  { name: 'Training', path: '/sprites/dolphin_training.png', frames: 8 },
  { name: 'Defeated', path: '/sprites/dolphin_defeated.png', frames: 8 }
]

const botAnimations = [
  { name: 'Aggressive', path: '/sprites/bot_aggressive.png', frames: 7 },
  { name: 'Training', path: '/sprites/bot_training.png', frames: 8 },
  { name: 'Tired', path: '/sprites/bot_tired.png', frames: 8 },
  { name: 'Defeated', path: '/sprites/bot_defeated.png', frames: 8 }
]

const selectedDolphinAnim = ref<number | null>(null) // null = default/reset state
const selectedBotAnim = ref<number | null>(null) // null = default/reset state

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
}
const animatedSprites: AnimatedSprite[] = []

// Character positions
const dolphinPositions = [
  { x: -1.8, y: 0.8, z: 1 },
  { x: -0.5, y: 0.7, z: 1 },
  { x: -0.4, y: -0.2, z: 1 }
]

const botPositions = [
  { x: 2.5, y: 1.4, z: 1 },
  { x: 1.1, y: 1.3, z: 1 },
  { x: 0.8, y: 2.2, z: 1 }
]

const spriteSize = 0.8

const goBack = () => {
  router.push('/')
}

// Create animated sprite from sprite sheet
const createAnimatedSprite = (
  texturePath: string,
  frameCount: number,
  position: { x: number; y: number; z: number },
  size: number,
  textureLoader: THREE.TextureLoader,
  flipX: boolean = false,
  team: 'dolphin' | 'bot'
): Promise<AnimatedSprite> => {
  return new Promise((resolve) => {
    textureLoader.load(texturePath, (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace
      texture.magFilter = THREE.LinearFilter
      texture.minFilter = THREE.LinearFilter
      texture.wrapS = THREE.ClampToEdgeWrapping
      texture.wrapT = THREE.ClampToEdgeWrapping

      // Calculate frame aspect ratio from sprite sheet dimensions
      const sheetWidth = texture.image.width
      const sheetHeight = texture.image.height
      const frameWidth = sheetWidth / frameCount
      const frameAspect = frameWidth / sheetHeight

      // Set up texture for sprite sheet animation with slight inset to avoid edge bleeding
      const frameRatio = 1 / frameCount
      texture.repeat.set(frameRatio * 0.98, 0.98)
      texture.offset.set(0.01 * frameRatio, 0.01)

      // Create geometry with correct aspect ratio
      const geometry = new THREE.PlaneGeometry(size * frameAspect, size)
      const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        side: THREE.DoubleSide
      })

      const mesh = new THREE.Mesh(geometry, material)
      mesh.position.set(position.x, position.y, position.z)

      // Flip horizontally if needed
      if (flipX) {
        mesh.scale.x = -1
      }

      scene.add(mesh)

      const sprite: AnimatedSprite = {
        mesh,
        frameCount,
        currentFrame: 0,
        frameTime: 50, // ms per frame
        lastFrameTime: 0,
        team,
        position,
        flipX,
        animationComplete: true, // Start completed (static on first frame)
        isReversing: false
      }

      animatedSprites.push(sprite)
      resolve(sprite)
    })
  })
}

// Update sprite texture (for animation switching)
const updateSpriteTexture = (
  sprite: AnimatedSprite,
  texturePath: string,
  frameCount: number,
  textureLoader: THREE.TextureLoader
) => {
  textureLoader.load(texturePath, (texture) => {
    texture.colorSpace = THREE.SRGBColorSpace
    texture.magFilter = THREE.LinearFilter
    texture.minFilter = THREE.LinearFilter
    texture.wrapS = THREE.ClampToEdgeWrapping
    texture.wrapT = THREE.ClampToEdgeWrapping

    // Calculate frame aspect ratio
    const sheetWidth = texture.image.width
    const sheetHeight = texture.image.height
    const frameWidth = sheetWidth / frameCount
    const frameAspect = frameWidth / sheetHeight

    // Set up texture for sprite sheet animation with slight inset
    const frameRatio = 1 / frameCount
    texture.repeat.set(frameRatio * 0.98, 0.98)
    texture.offset.set(0.01 * frameRatio, 0.01)

    // Update material
    const material = sprite.mesh.material as THREE.MeshBasicMaterial
    material.map?.dispose()
    material.map = texture
    material.needsUpdate = true

    // Update geometry for new aspect ratio
    sprite.mesh.geometry.dispose()
    sprite.mesh.geometry = new THREE.PlaneGeometry(spriteSize * frameAspect, spriteSize)

    // Update sprite properties and reset animation
    sprite.frameCount = frameCount
    sprite.currentFrame = 0
    sprite.animationComplete = false
    sprite.lastFrameTime = 0
  })
}

// Switch animation for a team
const switchTeamAnimation = (team: 'dolphin' | 'bot', animIndex: number) => {
  const anims = team === 'dolphin' ? dolphinAnimations : botAnimations
  const anim = anims[animIndex]

  animatedSprites
    .filter((s) => s.team === team)
    .forEach((sprite) => {
      updateSpriteTexture(sprite, anim.path, anim.frames, textureLoaderRef)
    })
}

// Watch for animation changes
const onDolphinAnimChange = (index: number) => {
  selectedDolphinAnim.value = index
  switchTeamAnimation('dolphin', index)
}

const onBotAnimChange = (index: number) => {
  selectedBotAnim.value = index
  switchTeamAnimation('bot', index)
}

// Reset team animation (play in reverse back to frame 0)
const resetTeamAnimation = (team: 'dolphin' | 'bot') => {
  // Deselect the radio button
  if (team === 'dolphin') {
    selectedDolphinAnim.value = null
  } else {
    selectedBotAnim.value = null
  }

  animatedSprites
    .filter((s) => s.team === team)
    .forEach((sprite) => {
      // Only reverse if not already at frame 0
      if (sprite.currentFrame > 0) {
        sprite.animationComplete = false
        sprite.isReversing = true
        sprite.lastFrameTime = 0
      }
    })
}

// Update sprite animation (plays once, stops on last/first frame)
const updateSpriteAnimation = (sprite: AnimatedSprite, time: number) => {
  // Skip if animation is already complete
  if (sprite.animationComplete) return

  if (time - sprite.lastFrameTime > sprite.frameTime) {
    if (sprite.isReversing) {
      // Reverse animation - go back to frame 0
      if (sprite.currentFrame <= 0) {
        sprite.animationComplete = true
        sprite.isReversing = false
        return
      }
      sprite.currentFrame--
    } else {
      // Forward animation - go to last frame
      if (sprite.currentFrame >= sprite.frameCount - 1) {
        sprite.animationComplete = true
        return
      }
      sprite.currentFrame++
    }

    const texture = (sprite.mesh.material as THREE.MeshBasicMaterial).map
    if (texture) {
      const frameRatio = 1 / sprite.frameCount
      texture.offset.x = sprite.currentFrame * frameRatio + 0.01 * frameRatio
    }
    sprite.lastFrameTime = time
  }
}

const initScene = () => {
  if (!canvasContainer.value) return

  const width = canvasContainer.value.clientWidth
  const height = canvasContainer.value.clientHeight

  // Scene with solid background color
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x7ba3be)

  // Orthographic camera for 2D - apply default zoom
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

  // Renderer - no alpha needed since we have solid background
  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(width, height)
  renderer.setPixelRatio(window.devicePixelRatio)
  canvasContainer.value.appendChild(renderer.domElement)

  textureLoaderRef = new THREE.TextureLoader()

  // Load background texture
  textureLoaderRef.load('/scene.webp', (texture) => {
    // Ensure texture is rendered at full color
    texture.colorSpace = THREE.SRGBColorSpace

    const imgAspect = texture.image.width / texture.image.height

    // Calculate plane size to cover screen at max zoom out level
    // We need to ensure coverage when zoomed out to MAX_ZOOM_OUT
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
      transparent: false
    })
    const plane = new THREE.Mesh(geometry, material)
    plane.position.z = 0
    scene.add(plane)

    // Create dolphins on left side (flipped to face right)
    dolphinPositions.forEach((pos) => {
      createAnimatedSprite(
        dolphinAnimations[0].path,
        dolphinAnimations[0].frames,
        pos,
        spriteSize,
        textureLoaderRef,
        true,
        'dolphin'
      )
    })

    // Create bots on right side
    botPositions.forEach((pos) => {
      createAnimatedSprite(
        botAnimations[0].path,
        botAnimations[0].frames,
        pos,
        spriteSize,
        textureLoaderRef,
        false,
        'bot'
      )
    })
  })

  // Zoom handler
  const handleWheel = (e: WheelEvent) => {
    e.preventDefault()
    const zoomSpeed = 0.001
    currentZoom += e.deltaY * zoomSpeed

    // Clamp zoom
    currentZoom = Math.max(MAX_ZOOM_IN, Math.min(MAX_ZOOM_OUT, currentZoom))

    updateCameraZoom()
  }

  // Pan handlers
  const handlePointerDown = (e: PointerEvent) => {
    isPanning = true
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

    // Calculate max pan distance (half of what's outside the view)
    const maxPanX = Math.max(0, (planeWidth - viewWidth) / 2)
    const maxPanY = Math.max(0, (planeHeight - viewHeight) / 2)

    camera.position.x = Math.max(-maxPanX, Math.min(maxPanX, camera.position.x))
    camera.position.y = Math.max(-maxPanY, Math.min(maxPanY, camera.position.y))
  }

  const handlePointerMove = (e: PointerEvent) => {
    if (!isPanning) return

    const deltaX = e.clientX - startX
    const deltaY = e.clientY - startY

    // Convert screen pixels to world units
    const worldUnitsPerPixel = (frustumSize * currentZoom) / canvasContainer.value!.clientHeight

    camera.position.x = cameraStartX - deltaX * worldUnitsPerPixel
    camera.position.y = cameraStartY + deltaY * worldUnitsPerPixel

    // Clamp to bounds
    clampCameraPosition()
  }

  const handlePointerUp = (e: PointerEvent) => {
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

    // Clamp position after zoom change
    clampCameraPosition()
  }

  // Touch handlers for pinch-to-zoom and pan
  const getTouchDistance = (touches: TouchList) => {
    const dx = touches[0].clientX - touches[1].clientX
    const dy = touches[0].clientY - touches[1].clientY
    return Math.sqrt(dx * dx + dy * dy)
  }

  const getTouchCenter = (touches: TouchList) => {
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2
    }
  }

  const handleTouchStart = (e: TouchEvent) => {
    e.preventDefault()

    if (e.touches.length === 2) {
      // Pinch start
      initialPinchDistance = getTouchDistance(e.touches)
      initialZoom = currentZoom
      isTouchPanning = false
    } else if (e.touches.length === 1) {
      // Single finger pan start
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
      // Pinch zoom
      const currentDistance = getTouchDistance(e.touches)
      const scale = currentDistance / initialPinchDistance

      // Invert scale for zoom direction (pinch out = zoom in = smaller value)
      currentZoom = initialZoom / scale
      currentZoom = Math.max(MAX_ZOOM_IN, Math.min(MAX_ZOOM_OUT, currentZoom))

      updateCameraZoom()
    } else if (e.touches.length === 1 && isTouchPanning) {
      // Single finger pan
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

  // Touch events
  canvasContainer.value.addEventListener('touchstart', handleTouchStart, { passive: false })
  canvasContainer.value.addEventListener('touchmove', handleTouchMove, { passive: false })
  canvasContainer.value.addEventListener('touchend', handleTouchEnd)

  // Animation loop
  const animate = (time: number) => {
    animationFrameId = requestAnimationFrame(animate)

    // Update sprite animations
    animatedSprites.forEach((sprite) => {
      updateSpriteAnimation(sprite, time)
    })

    renderer.render(scene, camera)
  }
  animate(0)

  // Handle resize
  const handleResize = () => {
    if (!canvasContainer.value) return
    const w = canvasContainer.value.clientWidth
    const h = canvasContainer.value.clientHeight

    updateCameraZoom()
    renderer.setSize(w, h)
  }
  window.addEventListener('resize', handleResize)
}

onMounted(() => {
  initScene()
})

onUnmounted(() => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
  }
  if (renderer) {
    renderer.dispose()
  }
})
</script>

<template>
  <div class="min-h-screen w-full bg-[#7ba3be] relative overflow-hidden">
    <!-- Back button -->
    <div class="absolute top-4 left-4 z-20">
      <Button
        @click="goBack"
        size="icon"
        class="bg-white/20 hover:bg-white/30 border border-white/30 backdrop-blur-md rounded-xl shadow-lg transition-all duration-200"
      >
        <ArrowLeft class="w-4 h-4 text-white" />
      </Button>
    </div>

    <!-- Animation Controls Panel -->
    <div class="absolute top-4 right-4 z-20 flex flex-col gap-3">
      <!-- Dolphins Animation Selector -->
      <div class="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20 shadow-lg">
        <div class="flex items-center justify-between mb-2">
          <div class="text-white/80 text-xs font-medium">Dolphins</div>
          <button
            @click="resetTeamAnimation('dolphin')"
            class="text-[10px] px-2 py-0.5 bg-blue-400/20 hover:bg-blue-400/30 text-blue-200 rounded transition-colors"
          >
            Reset
          </button>
        </div>
        <div class="flex flex-col gap-1">
          <label
            v-for="(anim, index) in dolphinAnimations"
            :key="anim.name"
            class="flex items-center gap-2 cursor-pointer text-white/90 text-sm hover:bg-white/10 rounded px-2 py-1 transition-colors"
          >
            <input
              type="radio"
              name="dolphin-anim"
              :value="index"
              :checked="selectedDolphinAnim === index"
              @change="onDolphinAnimChange(index)"
              class="w-3 h-3 accent-blue-400"
            />
            {{ anim.name }}
          </label>
        </div>
      </div>

      <!-- Bots Animation Selector -->
      <div class="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20 shadow-lg">
        <div class="flex items-center justify-between mb-2">
          <div class="text-white/80 text-xs font-medium">Bots</div>
          <button
            @click="resetTeamAnimation('bot')"
            class="text-[10px] px-2 py-0.5 bg-orange-400/20 hover:bg-orange-400/30 text-orange-200 rounded transition-colors"
          >
            Reset
          </button>
        </div>
        <div class="flex flex-col gap-1">
          <label
            v-for="(anim, index) in botAnimations"
            :key="anim.name"
            class="flex items-center gap-2 cursor-pointer text-white/90 text-sm hover:bg-white/10 rounded px-2 py-1 transition-colors"
          >
            <input
              type="radio"
              name="bot-anim"
              :value="index"
              :checked="selectedBotAnim === index"
              @change="onBotAnimChange(index)"
              class="w-3 h-3 accent-orange-400"
            />
            {{ anim.name }}
          </label>
        </div>
      </div>
    </div>

    <!-- Three.js Canvas -->
    <div
      ref="canvasContainer"
      class="w-full h-screen cursor-grab active:cursor-grabbing"
      style="touch-action: none"
    ></div>
  </div>
</template>

<style scoped>
canvas {
  display: block;
}
</style>
