<script setup lang="ts">
import AdminSheet from '@/components/layouts/AdminSheet.vue'
</script>

<template>
  <div class="min-h-screen bg-background text-foreground">
    <router-view />
    <AdminSheet />
  </div>
</template>
