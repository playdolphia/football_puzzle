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

        <!-- Your Players -->
        <section class="border border-white/10 p-6 space-y-4">
          <h2 class="text-white text-lg font-medium tracking-wide border-b border-white/10 pb-3">Understanding Your Players</h2>
          <div class="space-y-4 text-white/60 text-sm leading-relaxed">
            <p>Each player in your squad is a Dolphin with unique stats and abilities. Your team consists of different positions:</p>
            <div class="grid grid-cols-2 gap-3 my-4">
              <div class="border border-white/10 p-3 rounded">
                <div class="text-white font-medium mb-1">GK (Goalkeeper)</div>
                <div class="text-xs text-white/40">Guards your goal</div>
              </div>
              <div class="border border-white/10 p-3 rounded">
                <div class="text-white font-medium mb-1">DEF (Defender)</div>
                <div class="text-xs text-white/40">Protects your side</div>
              </div>
              <div class="border border-white/10 p-3 rounded">
                <div class="text-white font-medium mb-1">MID (Midfielder)</div>
                <div class="text-xs text-white/40">Controls the game</div>
              </div>
              <div class="border border-white/10 p-3 rounded">
                <div class="text-white font-medium mb-1">ATT (Attacker)</div>
                <div class="text-xs text-white/40">Scores goals</div>
              </div>
            </div>

            <div class="border-t border-white/10 pt-4 mt-4">
              <h3 class="text-white font-medium mb-3">Player Stats</h3>
              <div class="space-y-2">
                <div><span class="text-[#4fd4d4]">Stamina:</span> How long they can maintain peak performance</div>
                <div><span class="text-[#4fd4d4]">Strength:</span> Physical power and defensive ability</div>
                <div><span class="text-[#4fd4d4]">Awareness:</span> Tactical intelligence and positioning</div>
                <div><span class="text-[#4fd4d4]">Finishing:</span> Ability to score goals</div>
              </div>
            </div>

            <div class="border-t border-white/10 pt-4 mt-4">
              <h3 class="text-white font-medium mb-2">Level & XP</h3>
              <p>Players gain XP through training and matches. As they level up, they become stronger and more valuable to your club.</p>
            </div>
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

        <!-- Club & Progression -->
        <section class="border border-white/10 p-6 space-y-4">
          <h2 class="text-white text-lg font-medium tracking-wide border-b border-white/10 pb-3">Club Progression</h2>
          <div class="space-y-3 text-white/60 text-sm leading-relaxed">
            <div class="space-y-2">
              <h3 class="text-white font-medium">Club Level</h3>
              <p>Your club's level is the average level of all your players. Train your team to increase your club's overall strength.</p>
            </div>

            <div class="space-y-2 pt-2">
              <h3 class="text-white font-medium">Fans</h3>
              <p>Win matches to earn fans! The more fans you have, the more prestigious your club becomes. Fans are earned as rewards when you win matches against bot opponents.</p>
            </div>

            <div class="space-y-2 pt-2">
              <h3 class="text-white font-medium">Renaming Your Club</h3>
              <p>Click on your club name in the top-left corner of the field view to rename your club at any time.</p>
            </div>
          </div>
        </section>

        <!-- Bot Opponents -->
        <section class="border border-white/10 p-6 space-y-4">
          <h2 class="text-white text-lg font-medium tracking-wide border-b border-white/10 pb-3">About Bot Opponents</h2>
          <div class="space-y-3 text-white/60 text-sm leading-relaxed">
            <p>During matches, your Dolphin team will face off against bot opponents. These bots appear on the field with animations when you start a match and disappear after the match concludes.</p>
            <p>Bots may occasionally show different animations during the match - from aggressive stances to training poses. These are just for visual variety and don't affect the match outcome.</p>
            <p>The match difficulty you choose determines how challenging the bot team will be and the rewards you'll receive for winning.</p>
          </div>
        </section>

        <!-- Tips -->
        <section class="border border-white/10 p-6 space-y-4">
          <h2 class="text-white text-lg font-medium tracking-wide border-b border-white/10 pb-3">Pro Tips</h2>
          <ul class="space-y-3 text-white/60 text-sm">
            <li class="flex items-start gap-2">
              <span class="text-[#4fd4d4]">•</span>
              <span>Tap on any Dolphin in the field view to see their stats and take actions</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-[#4fd4d4]">•</span>
              <span>Keep an eye on your team's average energy percentage displayed in the top-left corner</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-[#4fd4d4]">•</span>
              <span>Train strategically - different training types improve different stats based on what your team needs</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-[#4fd4d4]">•</span>
              <span>Balance training with rest to keep your team's energy high for matches</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-[#4fd4d4]">•</span>
              <span>Use feeding for quick energy boosts when you need a player ready quickly</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-[#4fd4d4]">•</span>
              <span>Start with Easy difficulty matches when your team is new, then progress to harder challenges</span>
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
