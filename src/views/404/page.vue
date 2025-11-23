<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-vue-next'

const router = useRouter()

const goHome = () => {
	router.push('/')
}
</script>

<template>
	<div class="flex flex-row justify-center bg-background mt-4">
		<Card class="max-w-md w-full shadow-lg">
			<CardContent class="flex flex-col items-center text-center space-y-6 py-10">
				<AlertTriangle class="w-8 h-8 text-destructive" />
				<div>
					<h1 class="text-2xl font-bold">404 - Page Not Found</h1>
					<p class="text-muted-foreground mt-2">
						Oops! The page you are looking for doesn’t exist or has been moved.
					</p>
				</div>
				<Button @click="goHome" class="mt-4">Back to Home</Button>
			</CardContent>
		</Card>
	</div>
</template>
