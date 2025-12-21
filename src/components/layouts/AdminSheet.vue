<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Zap, Sun, Moon, Eye, ExternalLink } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { useColorMode } from '@vueuse/core'
import { useGlobalStore } from '@/stores'

const router = useRouter()
const isOpen = ref(false)
const colorMode = useColorMode()
const globalStore = useGlobalStore()

const currentTheme = computed(() => {
  const tg = (window as any)?.Telegram?.WebApp
  return tg?.colorScheme || colorMode.value
})

const isSimulatingNonAdmin = computed(() => {
  return globalStore.getAdminSimulationState()
})

const isTestEnvironment = computed(() => {
  return !!import.meta.env.VITE_TEST_TRANSFER_TOKEN
})

const setTheme = (theme: 'light' | 'dark') => {
  try {
    const tg = (window as any)?.Telegram?.WebApp
    if (tg) {
      tg.colorScheme = theme
      tg.__mockTriggerEvent?.('themeChanged')
      toast.success(`Theme changed to ${theme}`)
    } else {
      // Fallback to regular color mode when Telegram WebApp is not available
      colorMode.value = theme
      toast.success(`Theme changed to ${theme}`)
    }
  } catch (error) {
    console.error('Failed to change theme:', error)
    toast.error('Failed to change theme')
  }
}

const toggleAdminSimulation = () => {
  try {
    globalStore.toggleAdminSimulation()
    const newState = globalStore.getAdminSimulationState()
    toast.success(newState ? 'Now viewing as non-admin' : 'Restored admin view')
  } catch (error) {
    console.error('Failed to toggle admin simulation:', error)
    toast.error('Failed to toggle admin simulation')
  }
}

const adminPages: Array<{
  name: string
  description: string
  url: string
  action: () => void
}> = [
  // Admin shortcuts can be added here
]
</script>

<template>
  <Sheet v-if="globalStore.isAdmin" v-model:open="isOpen">
    <SheetTrigger as-child>
      <Button size="game-icon" variant="game-icon" class="fixed top-4 right-4 z-50 text-[#4fd4d4]">
        <Zap class="w-5 h-5" />
      </Button>
    </SheetTrigger>
    <SheetContent variant="game" class="flex flex-col p-0">
      <SheetHeader class="p-4 pb-2 shrink-0 border-b border-white/10">
        <SheetTitle class="text-white uppercase tracking-wide text-sm">Admin Controls</SheetTitle>
        <SheetDescription class="text-white/50 text-xs">
          Administrative controls for testing and development
        </SheetDescription>
      </SheetHeader>

      <div class="flex-1 overflow-y-auto p-4 pt-2">
        <Tabs default-value="controls" class="w-full">
          <TabsList variant="game" class="grid w-full grid-cols-2">
            <TabsTrigger variant="game" value="controls">Controls</TabsTrigger>
            <TabsTrigger variant="game" value="pages">Pages</TabsTrigger>
          </TabsList>

          <TabsContent value="controls" class="mt-4">
            <div class="space-y-6">
              <!-- Theme Control - Only in test environments -->
              <div v-if="isTestEnvironment" class="space-y-3">
                <h3 class="text-white/70 uppercase tracking-wide text-xs font-medium">Theme Control</h3>
                <p class="text-white/40 text-xs">
                  Override the Telegram theme. Current: <span class="text-[#4fd4d4]">{{ currentTheme }}</span>
                </p>
                <div class="flex gap-3">
                  <Button
                    :variant="currentTheme === 'light' ? 'game-primary' : 'game-outline'"
                    size="game-sm"
                    class="flex-1 flex items-center gap-2"
                    @click="setTheme('light')"
                  >
                    <Sun class="w-4 h-4" />
                    Light
                  </Button>
                  <Button
                    :variant="currentTheme === 'dark' ? 'game-primary' : 'game-outline'"
                    size="game-sm"
                    class="flex-1 flex items-center gap-2"
                    @click="setTheme('dark')"
                  >
                    <Moon class="w-4 h-4" />
                    Dark
                  </Button>
                </div>
              </div>

              <!-- Admin Simulation -->
              <div class="space-y-3 pt-4 border-t border-white/10">
                <h3 class="text-white/70 uppercase tracking-wide text-xs font-medium">Admin Simulation</h3>
                <p class="text-white/40 text-xs">
                  Simulate the non-admin user experience
                </p>
                <div class="flex items-center space-x-3">
                  <Checkbox
                    variant="game"
                    :checked="isSimulatingNonAdmin"
                    @click="toggleAdminSimulation"
                  />
                  <div class="flex items-center gap-2 text-white/70">
                    <Eye class="w-4 h-4" />
                    <span class="text-xs">View as non-admin user</span>
                  </div>
                </div>
                <p v-if="isSimulatingNonAdmin" class="text-xs text-rose-400/80">
                  Currently viewing as non-admin. Admin controls are hidden.
                </p>
              </div>

              <!-- Global State Debug -->
              <div class="space-y-3 pt-4 border-t border-white/10">
                <h3 class="text-white/70 uppercase tracking-wide text-xs font-medium">Global State Debug</h3>

                <div class="space-y-2">
                  <div class="text-xs text-white/40 uppercase tracking-wide">Transfer Token:</div>
                  <div class="bg-white/5 border border-white/10 p-2 text-xs font-mono text-white/60 break-all max-h-20 overflow-y-auto">
                    {{ globalStore.transferToken || 'null' }}
                  </div>
                </div>

                <div class="space-y-2">
                  <div class="text-xs text-white/40 uppercase tracking-wide">API Token:</div>
                  <div class="bg-white/5 border border-white/10 p-2 text-xs font-mono text-white/60 break-all max-h-20 overflow-y-auto">
                    {{ globalStore.apiToken || 'null' }}
                  </div>
                </div>

                <div class="space-y-2">
                  <div class="text-xs text-white/40 uppercase tracking-wide">User:</div>
                  <div class="bg-white/5 border border-white/10 p-2 text-xs font-mono text-white/60 break-all max-h-32 overflow-y-auto">
                    {{ globalStore.user ? JSON.stringify(globalStore.user, null, 2) : 'null' }}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="pages" class="mt-4">
            <div class="space-y-3">
              <h3 class="text-white/70 uppercase tracking-wide text-xs font-medium">Admin Only Pages</h3>
              <p class="text-white/40 text-xs">
                Access admin-only pages and development features
              </p>
              <Table variant="game">
                <TableHeader>
                  <TableRow variant="game">
                    <TableHead variant="game">Page</TableHead>
                    <TableHead variant="game" class="w-[100px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow variant="game" v-for="page in adminPages" :key="page.name">
                    <TableCell variant="game" class="font-medium">{{ page.name }}</TableCell>
                    <TableCell variant="game">
                      <Button
                        size="game-sm"
                        variant="game-primary"
                        @click="page.action"
                        class="flex items-center gap-1"
                      >
                        <ExternalLink class="w-3 h-3" />
                        Open
                      </Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </SheetContent>
  </Sheet>
</template>