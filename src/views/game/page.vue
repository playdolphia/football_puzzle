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

// Pan and zoom state
let isPanning = false
let startX = 0
let startY = 0
let cameraStartX = 0
let cameraStartY = 0

// Zoom level: smaller value = see more (zoomed out), larger value = see less (zoomed in)
const MAX_ZOOM_IN = 0.2 // Most zoomed in (see less, closer view)
const MAX_ZOOM_OUT = 1 // Most zoomed out (see more, default, prevents seeing outside image)
let currentZoom = MAX_ZOOM_OUT // Start at max zoom out
let frustumSize = 10
let planeWidth = 0
let planeHeight = 0

// Sprite animation state
interface AnimatedSprite {
  mesh: THREE.Mesh
  frameCount: number
  currentFrame: number
  frameTime: number
  lastFrameTime: number
}
const animatedSprites: AnimatedSprite[] = []

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
  flipX: boolean = false
): Promise<AnimatedSprite> => {
  return new Promise((resolve) => {
    textureLoader.load(texturePath, (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace
      texture.magFilter = THREE.LinearFilter
      texture.minFilter = THREE.LinearFilter

      // Calculate frame aspect ratio from sprite sheet dimensions
      const sheetWidth = texture.image.width
      const sheetHeight = texture.image.height
      const frameWidth = sheetWidth / frameCount
      const frameAspect = frameWidth / sheetHeight

      // Set up texture for sprite sheet animation
      texture.repeat.set(1 / frameCount, 1)
      texture.offset.set(0, 0)

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
        frameTime: 100, // ms per frame
        lastFrameTime: 0
      }

      animatedSprites.push(sprite)
      resolve(sprite)
    })
  })
}

// Update sprite animation
const updateSpriteAnimation = (sprite: AnimatedSprite, time: number) => {
  if (time - sprite.lastFrameTime > sprite.frameTime) {
    sprite.currentFrame = (sprite.currentFrame + 1) % sprite.frameCount
    const texture = (sprite.mesh.material as THREE.MeshBasicMaterial).map
    if (texture) {
      texture.offset.x = sprite.currentFrame / sprite.frameCount
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

  const textureLoader = new THREE.TextureLoader()

  // Load background texture
  textureLoader.load('/scene.webp', (texture) => {
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

    // After background loads, add characters
    // Positions are relative to center of scene (isometric field)
    // Left side - Dolphins (3 players)
    const dolphinPositions = [
      { x: -1.8, y: 0.8, z: 1 },   // Top left attacker
      { x: -0.5, y: 0.7, z: 1 },   // Middle
      { x: -0.4, y: -0.2, z: 1 }   // Bottom left defender
    ]

    // Right side - Bots (3 players) near the right goal
    const botPositions = [
      { x: 2.5, y: 1.4, z: 1 },    // Top right near goal
      { x: 1.1, y: 1.3, z: 1 },    // Middle right
      { x: 0.8, y: 2.2, z: 1 }     // Bottom right
    ]

    const spriteSize = 0.8

    // Create dolphins on left side (flipped to face right)
    dolphinPositions.forEach((pos) => {
      createAnimatedSprite('/sprites/dolphin_happy.png', 6, pos, spriteSize, textureLoader, true)
    })

    // Create bots on right side (bot_aggressive has 7 frames)
    botPositions.forEach((pos) => {
      createAnimatedSprite('/sprites/bot_aggressive.png', 7, pos, spriteSize, textureLoader)
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

  // Add event listeners
  canvasContainer.value.addEventListener('wheel', handleWheel, { passive: false })
  canvasContainer.value.addEventListener('pointerdown', handlePointerDown)
  canvasContainer.value.addEventListener('pointermove', handlePointerMove)
  canvasContainer.value.addEventListener('pointerup', handlePointerUp)
  canvasContainer.value.addEventListener('pointerleave', handlePointerUp)

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

    <!-- Three.js Canvas -->
    <div ref="canvasContainer" class="w-full h-screen cursor-grab active:cursor-grabbing"></div>
  </div>
</template>

<style scoped>
canvas {
  display: block;
}
</style>
