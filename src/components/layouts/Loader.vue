<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import gsap from 'gsap'

interface Props {
  title?: string
  subtitle?: string
  variant?: 'default' | 'game'
}

defineProps<Props>()

const containerRef = ref<HTMLElement | null>(null)
const geometryRef = ref<HTMLElement | null>(null)
const line1Ref = ref<HTMLElement | null>(null)
const line2Ref = ref<HTMLElement | null>(null)
const line3Ref = ref<HTMLElement | null>(null)
const titleRef = ref<HTMLElement | null>(null)
const subtitleRef = ref<HTMLElement | null>(null)
const dotsRef = ref<HTMLElement | null>(null)

let timeline: gsap.core.Timeline | null = null

onMounted(() => {
  if (!geometryRef.value) return

  // Create the main timeline
  timeline = gsap.timeline({ repeat: -1 })

  // Initial state
  gsap.set([line1Ref.value, line2Ref.value, line3Ref.value], {
    scaleX: 0,
    transformOrigin: 'left center'
  })

  gsap.set(geometryRef.value, {
    rotation: 0,
    scale: 1
  })

  // Entrance animation for text
  gsap.fromTo(titleRef.value,
    { opacity: 0, y: 20 },
    { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out', delay: 0.2 }
  )

  gsap.fromTo(subtitleRef.value,
    { opacity: 0 },
    { opacity: 1, duration: 0.6, ease: 'power2.out', delay: 0.5 }
  )

  // Dots entrance
  if (dotsRef.value) {
    const dots = dotsRef.value.querySelectorAll('.dot')
    gsap.fromTo(dots,
      { opacity: 0, scale: 0 },
      {
        opacity: 1,
        scale: 1,
        duration: 0.3,
        stagger: 0.1,
        ease: 'back.out(1.7)',
        delay: 0.6
      }
    )
  }

  // Main geometry animation loop
  timeline
    // Phase 1: Lines draw in sequence
    .to(line1Ref.value, {
      scaleX: 1,
      duration: 0.4,
      ease: 'power2.inOut'
    })
    .to(line2Ref.value, {
      scaleX: 1,
      duration: 0.4,
      ease: 'power2.inOut'
    }, '-=0.2')
    .to(line3Ref.value, {
      scaleX: 1,
      duration: 0.4,
      ease: 'power2.inOut'
    }, '-=0.2')

    // Phase 2: Rotate the whole geometry
    .to(geometryRef.value, {
      rotation: 90,
      duration: 0.6,
      ease: 'power2.inOut'
    }, '+=0.3')

    // Phase 3: Pulse scale
    .to(geometryRef.value, {
      scale: 1.1,
      duration: 0.3,
      ease: 'power2.out'
    })
    .to(geometryRef.value, {
      scale: 1,
      duration: 0.3,
      ease: 'power2.in'
    })

    // Phase 4: Lines retract
    .to([line1Ref.value, line2Ref.value, line3Ref.value], {
      scaleX: 0,
      transformOrigin: 'right center',
      duration: 0.3,
      stagger: 0.1,
      ease: 'power2.in'
    }, '+=0.2')

    // Phase 5: Continue rotation
    .to(geometryRef.value, {
      rotation: 180,
      duration: 0.6,
      ease: 'power2.inOut'
    })

    // Reset for next loop
    .set([line1Ref.value, line2Ref.value, line3Ref.value], {
      transformOrigin: 'left center'
    })
    .to(geometryRef.value, {
      rotation: 360,
      duration: 0.6,
      ease: 'power2.inOut'
    })
    .set(geometryRef.value, {
      rotation: 0
    })

  // Continuous subtle floating animation
  gsap.to(geometryRef.value, {
    y: -6,
    duration: 2,
    ease: 'power1.inOut',
    yoyo: true,
    repeat: -1
  })

  // Dots pulsing animation
  if (dotsRef.value) {
    const dots = dotsRef.value.querySelectorAll('.dot')
    dots.forEach((dot, index) => {
      gsap.to(dot, {
        opacity: 0.3,
        scale: 0.8,
        duration: 0.6,
        ease: 'power1.inOut',
        yoyo: true,
        repeat: -1,
        delay: index * 0.2
      })
    })
  }
})

onUnmounted(() => {
  if (timeline) {
    timeline.kill()
  }
  gsap.killTweensOf([
    geometryRef.value,
    line1Ref.value,
    line2Ref.value,
    line3Ref.value,
    titleRef.value,
    subtitleRef.value
  ])
})
</script>

<template>
  <!-- MV3 Game variant - GSAP animated geometric loader -->
  <div v-if="variant === 'game'" ref="containerRef" class="text-center">
    <!-- Geometric animation container -->
    <div class="relative w-24 h-24 mx-auto mb-8">
      <!-- Outer frame - static -->
      <div class="absolute inset-0 border border-white/10"></div>

      <!-- Inner geometry - animated -->
      <div ref="geometryRef" class="absolute inset-4 flex flex-col justify-center gap-2">
        <!-- Three horizontal lines that animate -->
        <div ref="line1Ref" class="h-[2px] bg-[#4fd4d4]"></div>
        <div ref="line2Ref" class="h-[2px] bg-white/60"></div>
        <div ref="line3Ref" class="h-[2px] bg-[#4fd4d4]/50"></div>
      </div>

      <!-- Corner accents -->
      <div class="absolute top-0 left-0 w-3 h-3 border-t border-l border-[#4fd4d4]"></div>
      <div class="absolute top-0 right-0 w-3 h-3 border-t border-r border-[#4fd4d4]"></div>
      <div class="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-[#4fd4d4]"></div>
      <div class="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-[#4fd4d4]"></div>
    </div>

    <!-- Title - MV3 typography -->
    <p ref="titleRef" v-if="title" class="text-white text-sm font-medium tracking-widest uppercase mb-2 opacity-0">
      {{ title }}
    </p>

    <!-- Subtitle -->
    <p ref="subtitleRef" v-if="subtitle" class="text-white/40 text-xs tracking-wider opacity-0">
      {{ subtitle }}
    </p>

    <!-- Animated dots -->
    <div ref="dotsRef" class="flex justify-center gap-3 mt-6">
      <div class="dot w-1 h-1 bg-[#4fd4d4]"></div>
      <div class="dot w-1 h-1 bg-white/60"></div>
      <div class="dot w-1 h-1 bg-[#4fd4d4]"></div>
    </div>
  </div>

  <!-- Default variant - keep original for non-game contexts -->
  <div v-else class="text-center">
    <div class="relative w-32 h-32 mx-auto mb-8">
      <div class="absolute inset-0 bg-gradient-to-br from-emerald-400/20 to-cyan-400/20 rounded-full blur-2xl animate-pulse"></div>
      <div class="absolute inset-0 flex items-center justify-center">
        <div class="relative">
          <span class="text-6xl drop-shadow-[0_4px_20px_rgba(255,255,255,0.3)] animate-float">🎲</span>
        </div>
      </div>
      <div class="absolute inset-2 border-2 border-white/10 border-t-emerald-400/60 rounded-full animate-spin" style="animation-duration: 2s;"></div>
      <div class="absolute inset-0 border border-white/5 rounded-full"></div>
    </div>

    <p class="text-slate-700 dark:text-slate-200 text-xl font-semibold tracking-wide mb-2">
      {{ title }}
    </p>

    <p v-if="subtitle" class="text-slate-500 dark:text-slate-400 text-sm font-medium">
      {{ subtitle }}
    </p>

    <div class="flex justify-center gap-2 mt-6">
      <div class="w-2 h-2 bg-emerald-400/80 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.4)]" style="animation-delay: 0s;"></div>
      <div class="w-2 h-2 bg-emerald-400/80 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.4)]" style="animation-delay: 0.2s;"></div>
      <div class="w-2 h-2 bg-emerald-400/80 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.4)]" style="animation-delay: 0.4s;"></div>
    </div>
  </div>
</template>

<style scoped>
@keyframes float {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-8px) scale(1.02); }
}

.animate-float {
  animation: float 3s ease-in-out infinite;
}
</style>
