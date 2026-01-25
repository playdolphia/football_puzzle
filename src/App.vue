<script setup lang="ts">
import { useGlobalStore } from '@/stores'
import AdminSheet from '@/components/layouts/AdminSheet.vue'

const globalStore = useGlobalStore()
</script>

<template>
  <div class="min-h-screen">
    <router-view />
  </div>

  <!-- Admin Sheet (globally available to admins) -->
  <AdminSheet v-if="globalStore.isOriginalAdmin" />
</template>