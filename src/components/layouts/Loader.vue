<script setup lang="ts">
interface Props {
  title?: string
  subtitle?: string
}

defineProps<Props>()
</script>

<template>
  <div class="text-center">
    <!-- Minecraft-style blocky loader (soccer ball style) -->
    <div class="relative w-20 h-20 mx-auto mb-6">
      <div class="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-1">
        <div class="bg-green-700 border-4 border-green-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)] animate-[bounce_0.8s_ease-in-out_infinite]" style="border-radius: 0; animation-delay: 0s;"></div>
        <div class="bg-green-600 border-4 border-green-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)] animate-[bounce_0.8s_ease-in-out_infinite]" style="border-radius: 0; animation-delay: 0.1s;"></div>
        <div class="bg-green-700 border-4 border-green-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)] animate-[bounce_0.8s_ease-in-out_infinite]" style="border-radius: 0; animation-delay: 0.2s;"></div>
        <div class="bg-green-600 border-4 border-green-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)] animate-[bounce_0.8s_ease-in-out_infinite]" style="border-radius: 0; animation-delay: 0.3s;"></div>
        <div class="bg-white border-4 border-gray-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)] animate-[bounce_0.8s_ease-in-out_infinite]" style="border-radius: 0; animation-delay: 0.4s;"></div>
        <div class="bg-green-600 border-4 border-green-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)] animate-[bounce_0.8s_ease-in-out_infinite]" style="border-radius: 0; animation-delay: 0.5s;"></div>
        <div class="bg-green-700 border-4 border-green-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)] animate-[bounce_0.8s_ease-in-out_infinite]" style="border-radius: 0; animation-delay: 0.6s;"></div>
        <div class="bg-green-600 border-4 border-green-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)] animate-[bounce_0.8s_ease-in-out_infinite]" style="border-radius: 0; animation-delay: 0.7s;"></div>
        <div class="bg-green-700 border-4 border-green-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)] animate-[bounce_0.8s_ease-in-out_infinite]" style="border-radius: 0; animation-delay: 0.8s;"></div>
      </div>
    </div>

    <!-- Title -->
    <p
      class="text-yellow-400 text-2xl font-bold mb-2"
      style="font-family: 'Courier New', monospace; text-shadow: 3px 3px 0px rgba(0,0,0,0.8);"
    >
      {{ title }}
    </p>

    <!-- Subtitle (optional) -->
    <p
      v-if="subtitle"
      class="text-green-400 font-bold text-sm"
      style="font-family: 'Courier New', monospace; text-shadow: 2px 2px 0px rgba(0,0,0,0.8);"
    >
      {{ subtitle }}
    </p>

    <!-- Animated dots -->
    <div class="flex justify-center gap-2 mt-4">
      <div
        class="w-3 h-3 bg-yellow-400 border-2 border-yellow-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.8)] animate-[pulse_1.2s_ease-in-out_infinite]"
        style="border-radius: 0; animation-delay: 0s;"
      ></div>
      <div
        class="w-3 h-3 bg-yellow-400 border-2 border-yellow-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.8)] animate-[pulse_1.2s_ease-in-out_infinite]"
        style="border-radius: 0; animation-delay: 0.3s;"
      ></div>
      <div
        class="w-3 h-3 bg-yellow-400 border-2 border-yellow-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.8)] animate-[pulse_1.2s_ease-in-out_infinite]"
        style="border-radius: 0; animation-delay: 0.6s;"
      ></div>
    </div>
  </div>
</template>
