<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Users, Dumbbell, BedDouble, Utensils, Trophy, Zap } from 'lucide-vue-next'

const router = useRouter()

const goBack = () => {
  router.push('/')
}
</script>

<template>
  <div class="min-h-screen bg-[#0a0812] relative">
    <!-- Background Image with transparency -->
    <div
      class="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-15 blur-[1px]"
      style="background-image: url('/bg.webp');"
    ></div>

    <div class="container mx-auto px-4 py-6 relative z-10 max-w-2xl">
      <!-- Header -->
      <div class="flex items-center gap-4 mb-8">
        <Button
          @click="goBack"
          variant="game-icon"
          size="game-icon"
          class="w-10 h-10 border border-white/10 hover:border-[#4fd4d4]/50"
        >
          <ArrowLeft class="w-5 h-5" />
        </Button>
        <h1 class="text-white text-xl font-light tracking-wide">Club Management Guide</h1>
      </div>

      <!-- Content -->
      <div class="space-y-8">
        <!-- Getting Started -->
        <section class="border border-white/10 p-6 space-y-4">
          <div class="flex items-center gap-3 border-b border-white/10 pb-3">
            <Users class="w-5 h-5 text-[#4fd4d4]" />
            <h2 class="text-white text-lg font-medium tracking-wide">Getting Started</h2>
          </div>
          <div class="space-y-3 text-white/60 text-sm leading-relaxed">
            <p>Welcome to Club Management! Build and manage your own football club by training players, managing their energy, and competing in matches.</p>
            <p>When you create your club, you'll start with 6 beginner players: 1 goalkeeper and 5 outfield players. All players start with 100% energy and are ready to train!</p>
          </div>
        </section>

        <!-- Player Management -->
        <section class="border border-white/10 p-6 space-y-4">
          <h2 class="text-white text-lg font-medium tracking-wide border-b border-white/10 pb-3">Managing Your Players</h2>
          <div class="space-y-6">
            <!-- Train -->
            <div class="flex gap-4">
              <div class="flex-shrink-0 w-12 h-12 border border-[#4fd4d4]/30 flex items-center justify-center rounded-lg">
                <Dumbbell class="w-6 h-6 text-[#4fd4d4]" />
              </div>
              <div class="flex-1 space-y-2">
                <h3 class="text-white font-medium">Training</h3>
                <p class="text-white/60 text-sm">Train your players to improve their stats (stamina, strength, awareness, finishing) and gain XP. Training costs energy and takes time to complete.</p>
              </div>
            </div>

            <!-- Feed -->
            <div class="flex gap-4">
              <div class="flex-shrink-0 w-12 h-12 border border-[#4fd4d4]/30 flex items-center justify-center rounded-lg">
                <Utensils class="w-6 h-6 text-[#4fd4d4]" />
              </div>
              <div class="flex-1 space-y-2">
                <h3 class="text-white font-medium">Feeding</h3>
                <p class="text-white/60 text-sm">Quickly restore a small amount of energy. Feeding is instant and shows a brief animation.</p>
              </div>
            </div>

            <!-- Rest -->
            <div class="flex gap-4">
              <div class="flex-shrink-0 w-12 h-12 border border-[#4fd4d4]/30 flex items-center justify-center rounded-lg">
                <BedDouble class="w-6 h-6 text-[#4fd4d4]" />
              </div>
              <div class="flex-1 space-y-2">
                <h3 class="text-white font-medium">Rest</h3>
                <p class="text-white/60 text-sm">Choose between Short Rest (15 min, +15 energy) or Full Rest (40 min, +40 energy) to recover your players' energy.</p>
              </div>
            </div>

            <!-- Energy -->
            <div class="flex gap-4">
              <div class="flex-shrink-0 w-12 h-12 border border-[#4fd4d4]/30 flex items-center justify-center rounded-lg">
                <Zap class="w-6 h-6 text-[#4fd4d4]" />
              </div>
              <div class="flex-1 space-y-2">
                <h3 class="text-white font-medium">Energy Management</h3>
                <p class="text-white/60 text-sm">Each player has their own energy level. Training costs energy, so balance training with rest and feeding to keep your team in top condition.</p>
              </div>
            </div>
          </div>
        </section>

        <!-- Matches -->
        <section class="border border-white/10 p-6 space-y-4">
          <div class="flex items-center gap-3 border-b border-white/10 pb-3">
            <Trophy class="w-5 h-5 text-[#4fd4d4]" />
            <h2 class="text-white text-lg font-medium tracking-wide">Playing Matches</h2>
          </div>
          <div class="space-y-3 text-white/60 text-sm leading-relaxed">
            <p>Compete against bot teams to earn XP, energy, and fans for your club. Choose from three difficulty levels:</p>
            <ul class="space-y-2 ml-4">
              <li class="flex items-start gap-2">
                <span class="text-green-400 font-medium mt-0.5">Easy:</span>
                <span>Beginner opponents, good for practice</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-yellow-400 font-medium mt-0.5">Medium:</span>
                <span>Balanced challenge with better rewards</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-rose-400 font-medium mt-0.5">Hard:</span>
                <span>Tough opponents with maximum rewards</span>
              </li>
            </ul>
            <p class="pt-2">Note: You cannot start a match while any player is resting, training, or feeding. The "Play Match" button will show a countdown until all players are available.</p>
          </div>
        </section>

        <!-- Tips -->
        <section class="border border-white/10 p-6 space-y-4">
          <h2 class="text-white text-lg font-medium tracking-wide border-b border-white/10 pb-3">Tips</h2>
          <ul class="space-y-3 text-white/60 text-sm">
            <li class="flex items-start gap-2">
              <span class="text-[#4fd4d4]">•</span>
              <span>Tap on any player in the field view to see their stats and take actions</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-[#4fd4d4]">•</span>
              <span>Keep an eye on your team's average energy in the top-left corner</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-[#4fd4d4]">•</span>
              <span>Train strategically - different training types improve different stats</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-[#4fd4d4]">•</span>
              <span>Click on your club name to rename your club at any time</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-[#4fd4d4]">•</span>
              <span>Bot opponents will show animations occasionally during matches</span>
            </li>
          </ul>
        </section>

        <!-- Back Button -->
        <div class="pt-4">
          <Button
            @click="goBack"
            variant="game-ghost"
            size="game"
            class="w-full gap-2"
          >
            <ArrowLeft class="w-4 h-4" />
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>
