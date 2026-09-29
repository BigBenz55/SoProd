<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()
const notFound = computed(() => props.error.statusCode === 404)
</script>

<template>
  <main class="grid min-h-svh place-items-center bg-paper px-6 text-center text-ink">
    <div class="max-w-md">
      <SoMonogram :size="72" class="mx-auto" />
      <h1 class="display mt-10 text-5xl">{{ notFound ? 'Page introuvable' : 'Un contretemps' }}</h1>
      <p class="mt-6 text-graphite">
        {{ notFound
          ? 'Cette adresse ne mène nulle part. Si vous cherchez votre galerie, utilisez le lien exact reçu par message.'
          : 'Le site a rencontré un problème inattendu. Réessayez dans un instant.' }}
      </p>
      <button class="btn-line mt-10" @click="clearError({ redirect: '/' })">Revenir à l’accueil</button>
    </div>
  </main>
</template>
