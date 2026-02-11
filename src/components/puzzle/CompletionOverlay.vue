<template>
  <Transition
    enter-active-class="transition-all duration-500 ease-out"
    enter-from-class="opacity-0 scale-95"
    enter-to-class="opacity-100 scale-100"
    leave-active-class="transition-all duration-300 ease-in"
    leave-from-class="opacity-100 scale-100"
    leave-to-class="opacity-0 scale-95"
  >
    <div
      v-if="visible"
      class="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm"
      @click.self="goHome"
    >
      <div class="flex flex-col items-center gap-6 p-8 max-w-md w-full">
        <!-- Completed puzzle image -->
        <div class="w-full max-w-sm">
          <img
            :src="image"
            alt="Completed puzzle"
            class="w-full h-auto rounded-xl shadow-lg"
          />
        </div>

        <!-- Success message -->
        <div class="text-center space-y-2">
          <h2 class="text-3xl font-semibold tracking-wide text-foreground">
            Puzzle Complete
          </h2>
          <div class="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 rounded-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4 text-primary"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clip-rule="evenodd"
              />
            </svg>
            <span class="text-sm font-medium text-primary tracking-wide">
              Daily Challenge Solved
            </span>
          </div>
        </div>

        <!-- Stats -->
        <div class="flex items-center gap-8">
          <div class="text-center">
            <div class="text-3xl font-bold text-foreground">{{ moves }}</div>
            <div class="text-sm text-muted-foreground tracking-wide">Moves</div>
          </div>
          <div class="h-12 w-px bg-border" />
          <div class="text-center">
            <div class="text-3xl font-bold text-foreground">{{ time }}</div>
            <div class="text-sm text-muted-foreground tracking-wide">Time</div>
          </div>
        </div>

        <!-- Decorative divider -->
        <div class="w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        <!-- Message -->
        <p class="text-center text-muted-foreground text-sm leading-relaxed max-w-xs">
          Come back tomorrow for a new challenge
        </p>

        <!-- Home button -->
        <button
          @click="goHome"
          class="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium tracking-wide hover:bg-primary/90 transition-colors duration-200 shadow-md hover:shadow-lg"
        >
          Back to Home
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

interface Props {
  image: string;
  moves: number;
  time: string;
  visible: boolean;
}

defineProps<Props>();

const router = useRouter();

function goHome() {
  router.push('/');
}
</script>
