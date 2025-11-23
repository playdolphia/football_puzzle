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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
      <Button size="icon" variant="destructive" class="fixed top-4 right-4 z-50">
        <Zap class="w-4 h-4" />
      </Button>
    </SheetTrigger>
    <SheetContent class="flex flex-col p-0">
      <SheetHeader class="p-4 pb-2 shrink-0">
        <SheetTitle>Admin Controls</SheetTitle>
        <SheetDescription>
          Administrative controls for testing and development
        </SheetDescription>
      </SheetHeader>
      
      <div class="flex-1 overflow-y-auto p-4 pt-2">
        <Tabs default-value="controls" class="w-full">
          <TabsList class="grid w-full grid-cols-2">
            <TabsTrigger value="controls">Controls</TabsTrigger>
            <TabsTrigger value="pages">Pages</TabsTrigger>
          </TabsList>
          
          <TabsContent value="controls" class="mt-4">
            <div class="space-y-4">
              <!-- Theme Control - Only in test environments -->
              <Card v-if="isTestEnvironment">
                <CardHeader class="pb-3">
                  <CardTitle class="text-lg">Theme Control</CardTitle>
                </CardHeader>
                <CardContent class="space-y-4">
                  <p class="text-sm text-muted-foreground">
                    Override the Telegram theme for testing purposes. Current: <span class="font-medium capitalize">{{ currentTheme }}</span>
                  </p>
                  <div class="flex flex-col gap-3">
                    <Button 
                      :variant="currentTheme === 'light' ? 'default' : 'outline'" 
                      class="flex-1 flex items-center gap-2"
                      @click="setTheme('light')"
                    >
                      <Sun class="w-4 h-4" />
                      Light Theme
                    </Button>
                    <Button 
                      :variant="currentTheme === 'dark' ? 'default' : 'outline'" 
                      class="flex-1 flex items-center gap-2"
                      @click="setTheme('dark')"
                    >
                      <Moon class="w-4 h-4" />
                      Dark Theme
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <!-- Admin Simulation -->
              <Card>
                <CardHeader class="pb-3">
                  <CardTitle class="text-lg">Admin Simulation</CardTitle>
                </CardHeader>
                <CardContent class="space-y-4">
                  <p class="text-sm text-muted-foreground">
                    Simulate the non-admin user experience for testing purposes
                  </p>
                  <div class="flex items-center space-x-3">
                    <Checkbox
                      :checked="isSimulatingNonAdmin"
                      @click="toggleAdminSimulation"
                    />
                    <div class="flex items-center gap-2">
                      <Eye class="w-4 h-4" />
                      <span class="text-sm font-medium">View as non-admin user</span>
                    </div>
                  </div>
                  <p v-if="isSimulatingNonAdmin" class="text-xs text-orange-500">
                    Currently viewing as non-admin. Admin controls are hidden.
                  </p>
                </CardContent>
              </Card>

              <!-- Global State Debug -->
              <Card>
                <CardHeader class="pb-3">
                  <CardTitle class="text-lg">Global State Debug</CardTitle>
                </CardHeader>
                <CardContent class="space-y-3">
                  <div class="space-y-2">
                    <div class="text-xs font-semibold text-muted-foreground">Transfer Token:</div>
                    <div class="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs font-mono break-all max-h-20 overflow-y-auto">
                      {{ globalStore.transferToken || 'null' }}
                    </div>
                  </div>

                  <div class="space-y-2">
                    <div class="text-xs font-semibold text-muted-foreground">API Token:</div>
                    <div class="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs font-mono break-all max-h-20 overflow-y-auto">
                      {{ globalStore.apiToken || 'null' }}
                    </div>
                  </div>

                  <div class="space-y-2">
                    <div class="text-xs font-semibold text-muted-foreground">User:</div>
                    <div class="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs font-mono break-all max-h-32 overflow-y-auto">
                      {{ globalStore.user ? JSON.stringify(globalStore.user, null, 2) : 'null' }}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="pages" class="mt-4">
            <Card>
              <CardHeader class="pb-3">
                <CardTitle class="text-lg">Admin Only Pages</CardTitle>
              </CardHeader>
              <CardContent>
                <p class="text-sm text-muted-foreground mb-4">
                  Access admin-only pages and development features
                </p>
                <Table class="rounded-lg overflow-hidden">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Page</TableHead>
                      <TableHead class="w-[100px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow v-for="page in adminPages" :key="page.name">
                      <TableCell class="font-medium">{{ page.name }}</TableCell>
                      <TableCell>
                        <Button 
                          size="sm" 
                          variant="link"
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
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </SheetContent>
  </Sheet>
</template>