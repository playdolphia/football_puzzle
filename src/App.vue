<script setup lang="ts">
import { useGlobalStore } from '@/stores'
import AdminSheet from '@/components/layouts/AdminSheet.vue'

import { Toaster } from '@/components/ui/sonner'
import 'vue-sonner/style.css'

const globalStore = useGlobalStore()
</script>

<template>
  <div class="min-h-screen">
    <router-view />
  </div>
  
  <Toaster position="top-center" variant="game" />
  
  <!-- Admin Sheet (globally available to admins) -->
  <AdminSheet v-if="globalStore.isOriginalAdmin" />
</template>