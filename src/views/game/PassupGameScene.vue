<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { useGlobalStore } from '@/stores'
import { useColorMode } from '@vueuse/core'
import { toast } from 'vue-sonner'

const router = useRouter()
const globalStore = useGlobalStore()
const colorMode = useColorMode()
const canvasContainer = ref<HTMLDivElement>()

let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let ball: THREE.Mesh
let botGoalkeeper: THREE.Group // Bot goalkeeper (at far goal)
let userGoalkeeper: THREE.Group // User goalkeeper (at near goal)
let animationId: number
let clouds: THREE.Group[] = []
let projectors: THREE.Group[] = []
let sun: THREE.Mesh | null = null
let moon: THREE.Mesh | null = null
let stars: THREE.Points | null = null

const currentTheme = computed(() => {
  const tg = (window as any)?.Telegram?.WebApp
  return tg?.colorScheme || colorMode.value
})

// Game state
const ballVelocity = ref(new THREE.Vector3(0, 0, 0))
const blockerVelocity = ref(new THREE.Vector3(0, 0, 0))
const isAnimating = ref(false)
const isPassing = ref(false)
const lastPassResult = ref<{ success: boolean; blocker_direction: string; pass_direction: string; role: string } | null>(null)
const showResult = ref(false)
const showGameOverModal = ref(false)
const displayRound = ref<number | null>(null) // Store round number during animation
const isTransitioningRole = ref(false) // Hide round during role transition
const gravity = -20
const groundY = 0.25

// Camera rotation state
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })
const cameraRotation = ref(0)
const targetRotation = ref(0)
const maxRotation = 15 * (Math.PI / 180)
const cameraStartPos = { x: 0, y: 2, z: -8 }
const cameraTargetZ = ref(-8) // Target Z position for camera (changes based on role)
const cameraBaseRotation = ref(0) // Base rotation (0 for passer, PI for blocker)
const allowCameraRotation = ref(true) // Control when camera rotation is allowed

// Robot blocker animation
const blockerJumpOffset = ref(0)
const blockerJumpTime = ref(0)

// Character models
const userCharacterName = ref<string>('character-a')
const botCharacterName = ref<string>('character-b')
const sceneInitialized = ref(false)

// CDN base URL for character assets
const CHARACTERS_CDN_BASE_URL = 'https://nj7106qpk4fk5k4z.public.blob.vercel-storage.com/passup/assets/characters/'

// Setup loading manager with proper texture path
const loadingManager = new THREE.LoadingManager()
loadingManager.setURLModifier((url) => {
  // If the URL is a texture reference, ensure it uses the CDN path
  if (url.includes('texture-')) {
    return `${CHARACTERS_CDN_BASE_URL}${url.split('/').pop()}`
  }
  return url
})

const gltfLoader = new GLTFLoader(loadingManager)

// Computed properties from store
const gameState = computed(() => globalStore.passupGame)
const userScore = computed(() => gameState.value.score_user || 0)
const botScore = computed(() => gameState.value.score_bot || 0)
const currentRole = computed(() => gameState.value.current_user_role)
const isPasser = computed(() => currentRole.value === 'passer')
const currentRound = computed(() => {
  // If we captured the round number during pass, use that (prevents flickering)
  if (displayRound.value !== null && (isAnimating.value || showResult.value)) {
    return displayRound.value
  }

  // Calculate round number within current role (1-5)
  const shots = gameState.value.shots || []
  const roleShots = shots.filter(shot => {
    // Backend now uses 'user_role' instead of 'passer_type'
    const shotIsUserPasser = shot.user_role === 'passer'
    return isPasser.value ? shotIsUserPasser : !shotIsUserPasser
  })

  // Show next round to be played, capped at 5
  return Math.min(roleShots.length + 1, 5)
})
const gameFinished = computed(() => gameState.value.status === 'finished')

// Emit events
const emit = defineEmits<{
  pass: [direction: 'left' | 'center' | 'right']
  gameOver: []
}>()

const initScene = async () => {
  if (!canvasContainer.value) return

  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x87ceeb)
  scene.fog = new THREE.Fog(0x87ceeb, 20, 50)

  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  )
  camera.position.set(0, 2, -8)
  camera.lookAt(0, 1, 0)

  renderer = new THREE.WebGLRenderer({ antialias: false })
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  canvasContainer.value.appendChild(renderer.domElement)

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.7)
  scene.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.9)
  directionalLight.position.set(10, 15, 5)
  directionalLight.castShadow = true
  directionalLight.shadow.mapSize.width = 2048
  directionalLight.shadow.mapSize.height = 2048
  scene.add(directionalLight)

  createMinecraftGround()
  createMinecraftGoal()
  await createMinecraftGoalkeepers()
  createMinecraftBall()
  createMinecraftClouds()
  createStadiumProjectors()
  createSkyElements()
  updateTheme()
  addCameraControls()

  sceneInitialized.value = true

  animate()
  window.addEventListener('resize', onWindowResize)
}

const createMinecraftGround = () => {
  const grassLight = 0x6BC247
  const grassDark = 0x4FA83D
  const grassSideColor = 0x6B5D47
  const dirtColor = 0x8B6F47
  const fieldWidth = 60
  const fieldDepth = 45  // Increased depth
  const blockSize = 1

  // Extended field from -20 to 25 to cover both camera positions
  for (let x = -fieldWidth / 2; x < fieldWidth / 2; x += blockSize) {
    for (let z = -20; z < fieldDepth - 20; z += blockSize) {
      const geometry = new THREE.BoxGeometry(blockSize, 0.5, blockSize)
      const isLightStripe = Math.floor((x + z) / blockSize) % 2 === 0
      const topColor = isLightStripe ? grassLight : grassDark

      const materials = [
        new THREE.MeshStandardMaterial({ color: grassSideColor, flatShading: true }),
        new THREE.MeshStandardMaterial({ color: grassSideColor, flatShading: true }),
        new THREE.MeshStandardMaterial({ color: topColor, flatShading: true }),
        new THREE.MeshStandardMaterial({ color: dirtColor, flatShading: true }),
        new THREE.MeshStandardMaterial({ color: grassSideColor, flatShading: true }),
        new THREE.MeshStandardMaterial({ color: grassSideColor, flatShading: true })
      ]

      const block = new THREE.Mesh(geometry, materials)
      block.position.set(x, -0.25, z)
      block.receiveShadow = true
      scene.add(block)
    }
  }
}

const createMinecraftGoal = () => {
  // Create two goals - one at each end (increased distance for realism)
  createGoal(15)  // Far goal (bot's goal)
  createGoal(-15) // Near goal (user's goal)
}

const createGoal = (zPosition: number) => {
  const goalWidth = 7
  const goalHeight = 2.5
  const goalDepth = 2
  const postSize = 0.2

  const postMaterial = new THREE.MeshStandardMaterial({
    color: 0xEEEEEE,
    flatShading: true
  })

  const leftPost = new THREE.Mesh(
    new THREE.BoxGeometry(postSize, goalHeight, postSize),
    postMaterial
  )
  leftPost.position.set(-goalWidth / 2, goalHeight / 2, zPosition)
  leftPost.castShadow = true
  scene.add(leftPost)

  const rightPost = new THREE.Mesh(
    new THREE.BoxGeometry(postSize, goalHeight, postSize),
    postMaterial
  )
  rightPost.position.set(goalWidth / 2, goalHeight / 2, zPosition)
  rightPost.castShadow = true
  scene.add(rightPost)

  const crossbar = new THREE.Mesh(
    new THREE.BoxGeometry(goalWidth, postSize, postSize),
    postMaterial
  )
  crossbar.position.set(0, goalHeight, zPosition)
  crossbar.castShadow = true
  scene.add(crossbar)

  const netMaterial = new THREE.MeshStandardMaterial({
    color: 0xCCCCCC,
    transparent: true,
    opacity: 0.4,
    flatShading: true
  })

  const netCubeSize = 0.05
  const spacing = 0.3
  const netZ = zPosition + (zPosition > 0 ? goalDepth / 2 : -goalDepth / 2)

  for (let x = -goalWidth / 2; x <= goalWidth / 2; x += spacing) {
    for (let y = 0; y <= goalHeight; y += spacing) {
      const cube = new THREE.Mesh(
        new THREE.BoxGeometry(netCubeSize, netCubeSize, netCubeSize),
        netMaterial
      )
      cube.position.set(x, y, netZ)
      scene.add(cube)
    }
  }
}

const createMinecraftGoalkeepers = async () => {
  // Load character models for goalkeepers
  try {
    // Load bot goalkeeper character
    const botGltf = await gltfLoader.loadAsync(`${CHARACTERS_CDN_BASE_URL}${botCharacterName.value}.glb`)
    botGoalkeeper = botGltf.scene
    botGoalkeeper.position.set(0, 0, 14.5)
    botGoalkeeper.scale.set(0.6, 0.6, 0.6) // Smaller scale to match goalkeeper size
    botGoalkeeper.rotation.y = Math.PI // Face toward the field (180 degrees)
    botGoalkeeper.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })
    scene.add(botGoalkeeper)

    // Load user goalkeeper character
    const userGltf = await gltfLoader.loadAsync(`${CHARACTERS_CDN_BASE_URL}${userCharacterName.value}.glb`)
    userGoalkeeper = userGltf.scene
    userGoalkeeper.position.set(0, 0, -14.5)
    userGoalkeeper.scale.set(0.6, 0.6, 0.6) // Smaller scale to match goalkeeper size
    userGoalkeeper.rotation.y = 0 // Face toward the field (no rotation needed)
    userGoalkeeper.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })
    scene.add(userGoalkeeper)
  } catch (error) {
    console.error('Failed to load character models, using fallback:', error)
    // Fallback to old blocky goalkeepers if loading fails
    botGoalkeeper = createGoalkeeper(0xFF8800)
    botGoalkeeper.position.set(0, 0, 14.5)
    scene.add(botGoalkeeper)

    userGoalkeeper = createGoalkeeper(0x0088FF)
    userGoalkeeper.position.set(0, 0, -14.5)
    userGoalkeeper.rotation.y = Math.PI
    scene.add(userGoalkeeper)
  }
}

const createGoalkeeper = (shirtColor: number) => {
  const keeper = new THREE.Group()
  const skinColor = 0xFFDBB0

  const headGeometry = new THREE.BoxGeometry(0.6, 0.6, 0.6)
  const headMaterial = new THREE.MeshStandardMaterial({
    color: skinColor,
    flatShading: true
  })
  const head = new THREE.Mesh(headGeometry, headMaterial)
  head.position.y = 1.9
  head.castShadow = true
  keeper.add(head)

  const bodyGeometry = new THREE.BoxGeometry(0.7, 1.0, 0.4)
  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: shirtColor,
    flatShading: true
  })
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
  body.position.y = 1.0
  body.castShadow = true
  keeper.add(body)

  const armGeometry = new THREE.BoxGeometry(0.3, 0.8, 0.3)
  const armMaterial = new THREE.MeshStandardMaterial({
    color: shirtColor,
    flatShading: true
  })

  const leftArm = new THREE.Mesh(armGeometry, armMaterial)
  leftArm.position.set(-0.5, 1.2, 0)
  leftArm.rotation.z = Math.PI / 6
  leftArm.castShadow = true
  keeper.add(leftArm)

  const rightArm = new THREE.Mesh(armGeometry, armMaterial)
  rightArm.position.set(0.5, 1.2, 0)
  rightArm.rotation.z = -Math.PI / 6
  rightArm.castShadow = true
  keeper.add(rightArm)

  const legGeometry = new THREE.BoxGeometry(0.3, 0.8, 0.3)
  const legMaterial = new THREE.MeshStandardMaterial({
    color: 0x4A4A4A,
    flatShading: true
  })

  const leftLeg = new THREE.Mesh(legGeometry, legMaterial)
  leftLeg.position.set(-0.2, 0.4, 0)
  leftLeg.castShadow = true
  keeper.add(leftLeg)

  const rightLeg = new THREE.Mesh(legGeometry, legMaterial)
  rightLeg.position.set(0.2, 0.4, 0)
  rightLeg.castShadow = true
  keeper.add(rightLeg)

  return keeper
}

const createMinecraftBall = () => {
  ball = new THREE.Group() as any

  const white = 0xFFFFFF
  const black = 0x000000
  const cubeSize = 0.15  // Increased from 0.12 to make ball more visible

  const ballPattern = [
    [0, 0, 0, white],
    [1, 0, 0, black], [-1, 0, 0, black],
    [0, 1, 0, black], [0, -1, 0, black],
    [0, 0, 1, black], [0, 0, -1, black],
    [1, 1, 0, white], [-1, 1, 0, white],
    [1, -1, 0, white], [-1, -1, 0, white],
    [1, 0, 1, white], [-1, 0, 1, white],
    [1, 0, -1, white], [-1, 0, -1, white],
    [0, 1, 1, white], [0, -1, 1, white],
    [0, 1, -1, white], [0, -1, -1, white]
  ]

  ballPattern.forEach(([x, y, z, color]) => {
    const material = new THREE.MeshStandardMaterial({
      color: color as number,
      flatShading: true
    })
    const cube = new THREE.Mesh(
      new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize),
      material
    )
    cube.position.set(x * cubeSize, y * cubeSize, z * cubeSize)
    cube.castShadow = true
    ball.add(cube)
  })

  // Initial position for shooter (game always starts with user as shooter)
  ball.position.set(0, groundY + 0.2, -3)
  ball.castShadow = true
  scene.add(ball)
}

const createMinecraftClouds = () => {
  const cloudMaterial = new THREE.MeshStandardMaterial({
    color: 0xFFFFFF,
    flatShading: true
  })

  for (let i = 0; i < 6; i++) {
    const cloud = new THREE.Group()
    const numCubes = 5 + Math.floor(Math.random() * 4)

    for (let j = 0; j < numCubes; j++) {
      const size = 1.5 + Math.random() * 1
      const cube = new THREE.Mesh(
        new THREE.BoxGeometry(size, size * 0.7, size),
        cloudMaterial
      )
      cube.position.set(
        (Math.random() - 0.5) * 3,
        (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 2
      )
      cloud.add(cube)
    }

    cloud.position.set(
      (Math.random() - 0.5) * 50,
      10 + Math.random() * 5,
      5 + Math.random() * 20
    )
    cloud.rotation.y = Math.random() * Math.PI * 2
    clouds.push(cloud)
    scene.add(cloud)
  }
}

const createStadiumProjectors = () => {
  const createProjector = (x: number, z: number) => {
    const projector = new THREE.Group()

    const poleMaterial = new THREE.MeshStandardMaterial({
      color: 0x4A4A4A,
      flatShading: true
    })
    const pole = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 12, 0.5),
      poleMaterial
    )
    pole.position.y = 6
    pole.castShadow = true
    projector.add(pole)

    const headMaterial = new THREE.MeshStandardMaterial({
      color: 0x2A2A2A,
      flatShading: true
    })
    const head = new THREE.Mesh(
      new THREE.BoxGeometry(2, 0.8, 1),
      headMaterial
    )
    head.position.y = 12
    head.castShadow = true
    projector.add(head)

    const bulbMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFFF00,
      emissive: 0xFFFF00,
      emissiveIntensity: 1,
      flatShading: true
    })
    const bulb = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.6, 0.6),
      bulbMaterial
    )
    bulb.position.set(0, 11.5, 0)
    projector.add(bulb)

    const spotlight = new THREE.SpotLight(0xFFFFAA, 0, 30, Math.PI / 4, 0.5, 2)
    spotlight.position.set(0, 12, 0)
    spotlight.target.position.set(0, 0, 5)
    spotlight.castShadow = true
    projector.add(spotlight)
    projector.add(spotlight.target)

    projector.position.set(x, 0, z)
    projectors.push(projector)
    scene.add(projector)
  }

  // Projectors on shooter side (behind user when shooting)
  createProjector(-15, -12)
  createProjector(15, -12)

  // Projectors on keeper side (near user's goal for keeper view)
  createProjector(-15, 4)
  createProjector(15, 4)

  createProjector(-15, -4)
createProjector(15, -4)

  // Projectors on far side (bot's side)
  createProjector(-15, 20)
  createProjector(15, 20)
}

const createSkyElements = () => {
  const sunGeometry = new THREE.BoxGeometry(3, 3, 3)
  const sunMaterial = new THREE.MeshStandardMaterial({
    color: 0xFFFF00,
    emissive: 0xFFFF00,
    emissiveIntensity: 1,
    flatShading: true
  })
  sun = new THREE.Mesh(sunGeometry, sunMaterial)
  sun.position.set(-20, 15, 10)
  scene.add(sun)

  const moonGeometry = new THREE.BoxGeometry(2.5, 2.5, 2.5)
  const moonMaterial = new THREE.MeshStandardMaterial({
    color: 0xEEEEEE,
    emissive: 0xCCCCCC,
    emissiveIntensity: 0.5,
    flatShading: true
  })
  moon = new THREE.Mesh(moonGeometry, moonMaterial)
  moon.position.set(-20, 15, 10)
  scene.add(moon)

  const starGeometry = new THREE.BufferGeometry()
  const starVertices = []
  for (let i = 0; i < 200; i++) {
    const x = (Math.random() - 0.5) * 100
    const y = 15 + Math.random() * 20
    const z = (Math.random() - 0.5) * 100
    starVertices.push(x, y, z)
  }
  starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3))
  const starMaterial = new THREE.PointsMaterial({
    color: 0xFFFFFF,
    size: 0.3,
    transparent: true,
    opacity: 0.8
  })
  stars = new THREE.Points(starGeometry, starMaterial)
  scene.add(stars)
}

const updateTheme = () => {
  const isDark = currentTheme.value === 'dark'
  const skyColor = isDark ? 0x0A0A1A : 0x87CEEB
  scene.background = new THREE.Color(skyColor)
  scene.fog = new THREE.Fog(skyColor, 20, 50)

  if (sun) sun.visible = !isDark
  if (moon) moon.visible = isDark
  if (stars) stars.visible = isDark

  projectors.forEach(projector => {
    const spotlight = projector.children.find(child => child instanceof THREE.SpotLight) as THREE.SpotLight
    if (spotlight) {
      spotlight.intensity = isDark ? 2 : 0
    }
    const bulb = projector.children.find(child =>
      child instanceof THREE.Mesh && child.position.y === 11.5
    ) as THREE.Mesh
    if (bulb && bulb.material instanceof THREE.MeshStandardMaterial) {
      bulb.material.emissiveIntensity = isDark ? 1 : 0
    }
  })
}

const animate = () => {
  animationId = requestAnimationFrame(animate)

  if (isAnimating.value) {
    updateBallPhysics()
    updateBlockerPhysics()
  }

  // Smooth camera rotation for role switching (only when allowed)
  // Passer: behind ball looking at far goal, Blocker: behind goal looking at field
  if (allowCameraRotation.value) {
    const targetZ = isPasser.value ? -8 : -16 // Blocker camera just behind goal
    const targetBaseRotation = isPasser.value ? 0 : Math.PI

    if (Math.abs(cameraTargetZ.value - targetZ) > 0.01) {
      cameraTargetZ.value += (targetZ - cameraTargetZ.value) * 0.05
    }

    if (Math.abs(cameraBaseRotation.value - targetBaseRotation) > 0.001) {
      cameraBaseRotation.value += (targetBaseRotation - cameraBaseRotation.value) * 0.05
      updateCameraPosition()
    }
  }

  if (!isDragging.value && Math.abs(cameraRotation.value - targetRotation.value) > 0.001) {
    const lerpFactor = 0.1
    cameraRotation.value += (targetRotation.value - cameraRotation.value) * lerpFactor
    updateCameraPosition()
  }

  // Robot blocker jumping animation
  blockerJumpTime.value += 0.05
  blockerJumpOffset.value = Math.abs(Math.sin(blockerJumpTime.value)) * 0.15

  if (botGoalkeeper) {
    botGoalkeeper.position.y = blockerJumpOffset.value
  }
  if (userGoalkeeper) {
    userGoalkeeper.position.y = blockerJumpOffset.value
  }

  clouds.forEach((cloud, index) => {
    cloud.position.x += 0.01 + (index * 0.002)
    if (cloud.position.x > 30) {
      cloud.position.x = -30
    }
  })

  if (stars && stars.visible) {
    const positions = stars.geometry.attributes.position.array as Float32Array
    for (let i = 1; i < positions.length; i += 3) {
      positions[i] += Math.sin(Date.now() * 0.001 + i) * 0.01
    }
    stars.geometry.attributes.position.needsUpdate = true
  }

  renderer.render(scene, camera)
}

const updateBallPhysics = () => {
  const deltaTime = 1 / 60

  if (ball.position.y > groundY) {
    ballVelocity.value.y += gravity * deltaTime
  }

  ball.position.x += ballVelocity.value.x * deltaTime
  ball.position.y += ballVelocity.value.y * deltaTime
  ball.position.z += ballVelocity.value.z * deltaTime

  ball.rotation.x += ballVelocity.value.z * deltaTime * 0.3
  ball.rotation.z -= ballVelocity.value.x * deltaTime * 0.3

  // Check collision with active goalkeeper based on ball direction
  const ballRadius = 0.22
  const keeperWidth = 0.7
  const keeperHeight = 2.5

  // Determine which goalkeeper to check based on ball direction
  const activeKeeper = ball.position.z > 0 ? botGoalkeeper : userGoalkeeper
  const distanceToKeeper = Math.abs(ball.position.z - activeKeeper.position.z)
  const horizontalDistance = Math.abs(ball.position.x - activeKeeper.position.x)

  if (distanceToKeeper < 0.5 &&
      horizontalDistance < keeperWidth / 2 + ballRadius &&
      ball.position.y < keeperHeight) {
    ballVelocity.value.set(0, 0, 0)
    ball.position.z = activeKeeper.position.z + (ball.position.z > 0 ? -0.5 : 0.5)
    ball.position.y = groundY
  }

  if (ball.position.y < groundY) {
    ball.position.y = groundY

    if (Math.abs(ballVelocity.value.y) > 1) {
      ballVelocity.value.y = Math.abs(ballVelocity.value.y) * -0.25
    } else {
      ballVelocity.value.y = 0
    }

    ballVelocity.value.x *= 0.88
    ballVelocity.value.z *= 0.88
  }

  const hasReachedGoal = Math.abs(ball.position.z) >= 16
  const hasStopped = Math.abs(ballVelocity.value.x) < 0.05 &&
                     Math.abs(ballVelocity.value.z) < 0.05 &&
                     Math.abs(ballVelocity.value.y) < 0.05 &&
                     ball.position.y <= groundY + 0.05

  if (hasReachedGoal || hasStopped || Math.abs(ball.position.x) > 15) {
    isAnimating.value = false
    showResult.value = true // Set immediately to prevent round number recalculation
    ballVelocity.value.set(0, 0, 0)
    ball.position.y = groundY

    setTimeout(() => {
      if (!gameFinished.value) {
        setTimeout(() => {
          resetForNextShot()
        }, 2500)
      } else {
        setTimeout(() => {
          showResult.value = false
          showGameOverModal.value = true
          emit('gameOver')
        }, 2500)
      }
    }, 200)
  }
}

const updateBlockerPhysics = () => {
  const deltaTime = 1 / 60

  // Move the active blocker based on role
  const activeBlocker = isPasser.value ? botGoalkeeper : userGoalkeeper

  activeBlocker.position.x += blockerVelocity.value.x * deltaTime
  blockerVelocity.value.x *= 0.88

  const maxBlockerX = 2.5
  if (activeBlocker.position.x > maxBlockerX) {
    activeBlocker.position.x = maxBlockerX
    blockerVelocity.value.x = 0
  } else if (activeBlocker.position.x < -maxBlockerX) {
    activeBlocker.position.x = -maxBlockerX
    blockerVelocity.value.x = 0
  }

  if (Math.abs(blockerVelocity.value.x) < 0.05) {
    blockerVelocity.value.x = 0
  }
}

const getTargetPosition = (direction: 'left' | 'center' | 'right', role?: string): THREE.Vector3 => {
  // Passer: pass toward far goal (+Z), Blocker: ball comes from far goal
  // Use provided role or fall back to current isPasser state
  const isPasserRole = role ? role === 'passer' : isPasser.value
  const goalZ = isPasserRole ? 16.5 : -16.5
  const positions = {
    left: new THREE.Vector3(2.8, 1.3, goalZ),
    center: new THREE.Vector3(0, 1.5, goalZ),
    right: new THREE.Vector3(-2.8, 1.3, goalZ)
  }
  return positions[direction]
}

const getBlockerTargetX = (direction: 'left' | 'center' | 'right'): number => {
  const positions = {
    left: 1.8,
    center: 0,
    right: -1.8
  }
  return positions[direction]
}

const pass = async (direction: 'left' | 'center' | 'right') => {
  if (isAnimating.value || isPassing.value || gameFinished.value) return

  try {
    isPassing.value = true
    emit('pass', direction)

    // Wait for parent to handle API call
    // Animation will be triggered via animatePass method
  } catch (error) {
    console.error('Pass failed:', error)
    isPassing.value = false
  }
}

// Exposed method for parent to trigger animation
const animatePass = (ballDirection: 'left' | 'center' | 'right', blockerDirection: 'left' | 'center' | 'right', result: any) => {
  isAnimating.value = true
  showResult.value = false
  allowCameraRotation.value = false // Disable camera rotation during pass

  // Store the role at the time of the pass (before API updates it)
  const passRole = result.role

  // Calculate and store the round number for this pass (before backend updates)
  const shots = gameState.value.shots || []
  const roleShots = shots.filter(shot => {
    // Backend now uses 'user_role' instead of 'passer_type'
    const shotIsUserPasser = shot.user_role === 'passer'
    return passRole === 'passer' ? shotIsUserPasser : !shotIsUserPasser
  })
  const currentRoundNum = roleShots.length + 1 // The round that's about to be played
  displayRound.value = currentRoundNum

  // If this is the 5th pass as passer (switching to blocker), hide round counter to prevent showing 6/5
  // Only hide when transitioning from passer to blocker role (not blocker to passer)
  if (roleShots.length === 5 && passRole === 'passer') {
    isTransitioningRole.value = true
  }

  lastPassResult.value = {
    success: result.success,
    blocker_direction: blockerDirection,
    pass_direction: ballDirection,
    role: passRole
  }

  // Ball position is already set by resetForNextPass, don't change it here
  // This prevents the jumping effect when user clicks a direction
  const targetPos = getTargetPosition(ballDirection, passRole)
  const direction = new THREE.Vector3().subVectors(targetPos, ball.position).normalize()

  const power = 60
  ballVelocity.value.copy(direction.multiplyScalar(power))
  ballVelocity.value.y += 6

  // Animate the active blocker based on the role at pass time
  const activeBlocker = passRole === 'passer' ? botGoalkeeper : userGoalkeeper
  const blockerTargetX = getBlockerTargetX(blockerDirection)
  const blockerDir = blockerTargetX - activeBlocker.position.x
  blockerVelocity.value.x = blockerDir * 15

  isPassing.value = false
}

const resetForNextPass = () => {
  // Set ball starting position based on current role
  // Passer: further forward for full visibility above UI buttons, Blocker: ball comes from far
  const startZ = isPasser.value ? -3 : 8
  const startY = isPasser.value ? groundY + 0.2 : groundY  // Slightly elevated for passer
  ball.position.set(0, startY, startZ)
  ball.rotation.set(0, 0, 0)
  ballVelocity.value.set(0, 0, 0)

  botGoalkeeper.position.set(0, 0, 14.5)
  userGoalkeeper.position.set(0, 0, -14.5)
  blockerVelocity.value.set(0, 0, 0)

  isAnimating.value = false
  isPassing.value = false
  showResult.value = false
  lastPassResult.value = null
  displayRound.value = null // Reset round display

  // Re-enable camera rotation after positions are reset
  allowCameraRotation.value = true

  // Show round number again after camera transition completes (matching camera animation time)
  // This handles both normal transitions and 5th round transitions
  setTimeout(() => {
    isTransitioningRole.value = false
  }, 800) // Match the camera transition duration
}

// Alias for backward compatibility
const resetForNextShot = resetForNextPass

const addCameraControls = () => {
  if (!canvasContainer.value) return
  const canvas = canvasContainer.value

  canvas.addEventListener('mousedown', onDragStart)
  canvas.addEventListener('mousemove', onDragMove)
  canvas.addEventListener('mouseup', onDragEnd)
  canvas.addEventListener('mouseleave', onDragEnd)
  canvas.addEventListener('touchstart', onTouchStart)
  canvas.addEventListener('touchmove', onTouchMove)
  canvas.addEventListener('touchend', onDragEnd)
}

const onDragStart = (e: MouseEvent) => {
  isDragging.value = true
  dragStart.value = { x: e.clientX, y: e.clientY }
}

const onTouchStart = (e: TouchEvent) => {
  if (e.touches.length === 1) {
    isDragging.value = true
    dragStart.value = { x: e.touches[0].clientX, y: e.touches[0].clientY }
  }
}

const onDragMove = (e: MouseEvent) => {
  if (!isDragging.value) return
  const deltaX = e.clientX - dragStart.value.x
  updateCameraRotation(deltaX)
}

const onTouchMove = (e: TouchEvent) => {
  if (!isDragging.value || e.touches.length !== 1) return
  const deltaX = e.touches[0].clientX - dragStart.value.x
  updateCameraRotation(deltaX)
}

const onDragEnd = () => {
  isDragging.value = false
  targetRotation.value = 0
}

const updateCameraRotation = (deltaX: number) => {
  const sensitivity = 0.003
  const rotation = deltaX * sensitivity
  cameraRotation.value = Math.max(-maxRotation, Math.min(maxRotation, rotation))
  targetRotation.value = cameraRotation.value
  updateCameraPosition()
}

const updateCameraPosition = () => {
  // Apply both base rotation (for role) and drag rotation (for camera control)
  const totalRotation = cameraBaseRotation.value + cameraRotation.value

  if (isPasser.value) {
    // Passer: normal view from behind ball
    const radius = 8
    camera.position.x = radius * Math.sin(totalRotation)
    camera.position.z = cameraTargetZ.value * Math.cos(totalRotation)
    camera.position.y = 2
    camera.lookAt(0, 1, 15) // Look at far goal
  } else {
    // Blocker: behind and above the goal looking toward center field
    const radius = 5 // Distance from goal
    camera.position.x = radius * Math.sin(totalRotation)
    camera.position.z = -16 + (radius * Math.cos(totalRotation)) // Just behind user's goal at Z=-15
    camera.position.y = 2.5 // Height above ground
    camera.lookAt(0, 1, -10) // Look at area just in front of the goal
  }
}

const onWindowResize = () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
}

// Set characters for the game
const setCharacters = async (userCharacter: string, botCharacter: string) => {
  userCharacterName.value = userCharacter
  botCharacterName.value = botCharacter

  // Wait for scene initialization if it's not ready yet
  if (!sceneInitialized.value) {
    // Wait up to 5 seconds for scene to initialize
    const maxWaitTime = 5000
    const startTime = Date.now()
    while (!sceneInitialized.value && (Date.now() - startTime) < maxWaitTime) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    if (!sceneInitialized.value) {
      console.error('Scene initialization timed out')
      return
    }
  }

  // Reload goalkeepers with new characters if scene is already initialized
  if (scene && botGoalkeeper && userGoalkeeper) {
    // Remove old goalkeepers
    scene.remove(botGoalkeeper)
    scene.remove(userGoalkeeper)

    // Create new goalkeepers with selected characters
    await createMinecraftGoalkeepers()
  }
}

// Expose methods
defineExpose({
  animatePass,
  resetForNextShot,
  resetForNextPass,
  setCharacters
})

onMounted(() => {
  initScene()
})

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
  window.removeEventListener('resize', onWindowResize)
  if (renderer) {
    renderer.dispose()
  }
})

watch(currentTheme, () => {
  if (scene) {
    updateTheme()
  }
})
</script>

<template>
  <div ref="canvasContainer" class="w-full h-full relative" :class="isDragging ? 'cursor-grabbing' : 'cursor-grab'">
    <!-- Stats overlay -->
    <div class="absolute top-16 md:top-6 left-1/2 -translate-x-1/2 z-10">
      <div class="bg-gradient-to-b from-gray-800 to-gray-900 px-3 py-2 md:px-6 md:py-4 border-4 border-gray-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)]" style="font-family: 'Courier New', monospace; border-radius: 0;">
        <div class="flex items-center gap-2 md:gap-6">
          <!-- User Score -->
          <div class="text-center">
            <div class="text-sm text-gray-400">YOU</div>
            <div class="text-2xl md:text-3xl font-bold text-green-400">{{ userScore }}</div>
          </div>

          <!-- Round Counter -->
          <div v-if="!isTransitioningRole" class="text-center border-x-4 border-gray-700 px-4">
            <div class="text-sm text-gray-400">ROUND</div>
            <div class="text-xl md:text-2xl font-bold text-white">{{ currentRound }}/5</div>
          </div>
          <!-- Placeholder during transition to maintain layout -->
          <div v-else class="text-center border-x-4 border-gray-700 px-4 opacity-0">
            <div class="text-sm text-gray-400">ROUND</div>
            <div class="text-xl md:text-2xl font-bold text-white">0/5</div>
          </div>

          <!-- Bot Score -->
          <div class="text-center">
            <div class="text-sm text-gray-400">BOT</div>
            <div class="text-2xl md:text-3xl font-bold text-red-400">{{ botScore }}</div>
          </div>
        </div>

        <!-- Role indicator -->
        <div class="mt-2 text-center">
          <div class="inline-block bg-yellow-600 border-2 border-yellow-900 px-3 py-1 text-sm font-bold text-white" style="border-radius: 0;">
            {{ isPasser ? '⚽ PASSER' : '🤖 BLOCKER' }}
          </div>
        </div>
      </div>
    </div>

    <!-- Result overlay -->
    <div v-if="showResult && lastPassResult" class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
      <div class="bg-gradient-to-b from-gray-800 to-gray-900 px-6 md:px-8 py-4 md:py-6 border-8 text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,0.9)] animate-in fade-in zoom-in duration-300"
           :class="lastPassResult.success ? 'border-green-950' : 'border-red-950'"
           style="font-family: 'Courier New', monospace; border-radius: 0;">
        <div v-if="lastPassResult.success" class="text-3xl md:text-5xl font-bold text-green-400 mb-3 drop-shadow-[3px_3px_0px_rgba(0,0,0,1)]">
          PASS! ⚽
        </div>
        <div v-else class="text-3xl md:text-5xl font-bold text-red-400 mb-3 drop-shadow-[3px_3px_0px_rgba(0,0,0,1)]">
          BLOCKED! 🤖
        </div>
        <p class="text-xs md:text-sm text-gray-300 drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]">
          Pass: <span class="font-semibold text-white">{{ lastPassResult.pass_direction }}</span> |
          Blocker: <span class="font-semibold text-white">{{ lastPassResult.blocker_direction }}</span>
        </p>
      </div>
    </div>

    <!-- Passing controls -->
    <div v-if="!isAnimating && !gameFinished" class="absolute bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 z-10 w-full max-w-[90vw] md:max-w-none px-2 md:px-0">
      <div class="flex gap-2 md:gap-4 justify-center">
        <button
          @click="pass('left')"
          :disabled="isPassing"
          class="flex-1 md:flex-none bg-blue-700 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed border-4 border-blue-900 text-white px-4 md:px-6 py-3 md:py-4 font-bold text-sm md:text-base transition-all hover:scale-105 active:scale-95 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)]"
          style="font-family: 'Courier New', monospace; border-radius: 0;"
        >
          <span class="hidden md:inline">←</span> LEFT
        </button>
        <button
          @click="pass('center')"
          :disabled="isPassing"
          class="flex-1 md:flex-none bg-green-700 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed border-4 border-green-900 text-white px-4 md:px-6 py-3 md:py-4 font-bold text-sm md:text-base transition-all hover:scale-105 active:scale-95 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)]"
          style="font-family: 'Courier New', monospace; border-radius: 0;"
        >
          <span class="hidden md:inline">↑</span> CENTER
        </button>
        <button
          @click="pass('right')"
          :disabled="isPassing"
          class="flex-1 md:flex-none bg-red-700 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed border-4 border-red-900 text-white px-4 md:px-6 py-3 md:py-4 font-bold text-sm md:text-base transition-all hover:scale-105 active:scale-95 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)]"
          style="font-family: 'Courier New', monospace; border-radius: 0;"
        >
          RIGHT <span class="hidden md:inline">→</span>
        </button>
      </div>
      <p class="text-center text-[10px] md:text-sm text-gray-300 mt-2 md:mt-3 bg-black/80 backdrop-blur-sm px-2 md:px-4 py-1 md:py-2 border border-gray-700 max-w-fit mx-auto"
         style="font-family: 'Courier New', monospace; border-radius: 0;">
        {{ isPasser ? 'CHOOSE YOUR PASS DIRECTION' : 'PREDICT THE PASS DIRECTION' }}
      </p>
    </div>
  </div>
</template>
