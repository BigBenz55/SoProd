<script setup lang="ts">
definePageMeta({ layout: false })
useHead({ title: 'Espace photographe — SoProd' })

const route = useRoute()
const password = ref('')
const error = ref('')
const busy = ref(false)

async function submit() {
  if (!password.value) {
    error.value = 'Saisissez votre mot de passe.'
    return
  }
  busy.value = true
  error.value = ''
  try {
    await $fetch('/api/admin/login', { method: 'POST', body: { password: password.value } })
    const next = typeof route.query.suite === 'string' && route.query.suite.startsWith('/admin') ? route.query.suite : '/admin'
    await navigateTo(next)
  } catch (err) {
    error.value = errorMessage(err, 'Connexion impossible.')
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <main class="grid min-h-svh bg-ink lg:grid-cols-2">
    <div class="relative hidden overflow-hidden lg:block">
      <SoPhoto name="diner-table" alt="" sizes="50vw" class="absolute inset-0 size-full object-cover opacity-80" />
    </div>
    <div class="grid place-items-center bg-paper px-6 py-16">
      <form class="w-full max-w-[24rem]" novalidate @submit.prevent="submit">
        <SoWordmark class="text-[3rem]" />
        <h1 class="display mt-8 text-[2.4rem]">Espace photographe</h1>
        <p class="mt-3 text-graphite">Gestion des galeries, de l’indexation et des sélections clients.</p>

        <label for="password" class="field-label mt-12">Mot de passe</label>
        <input
          id="password"
          v-model="password"
          type="password"
          autocomplete="current-password"
          class="field mt-1"
          :aria-invalid="Boolean(error)"
          aria-describedby="login-error"
          autofocus
        >
        <p id="login-error" class="mt-3 min-h-6 text-sm" role="alert">{{ error }}</p>
        <button type="submit" class="btn-ink mt-6 w-full" :disabled="busy">
          {{ busy ? 'Connexion…' : 'Se connecter' }}
        </button>
        <NuxtLink to="/" class="caps link-under mt-10 inline-block py-1 text-graphite">Retour au site</NuxtLink>
      </form>
    </div>
  </main>
</template>
