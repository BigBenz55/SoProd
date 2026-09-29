<script setup lang="ts">
const value = ref('')
const error = ref('')

const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i

async function submit() {
  error.value = ''
  const token = value.value.trim().match(UUID)?.[0]
  if (!token) {
    error.value = 'Ce lien semble incomplet. Copiez-le en entier depuis le message reçu.'
    return
  }
  await navigateTo(`/g/${token.toLowerCase()}`)
}
</script>

<template>
  <form class="w-full" novalidate @submit.prevent="submit">
    <label for="acces-lien" class="field-label">Votre lien de galerie</label>
    <div class="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end">
      <input
        id="acces-lien"
        v-model="value"
        type="text"
        inputmode="url"
        autocomplete="off"
        spellcheck="false"
        class="field flex-1"
        placeholder="Collez ici le lien reçu par message"
        :aria-invalid="Boolean(error)"
        aria-describedby="acces-aide"
      >
      <button type="submit" class="btn-ink shrink-0">
        Ouvrir
        <SoIcon name="arrow-right" :size="16" />
      </button>
    </div>
    <p id="acces-aide" class="mt-3 text-sm" :class="error ? 'text-ink' : 'text-graphite'" role="status">
      <template v-if="error">{{ error }}</template>
      <template v-else>Il vous a été envoyé après le mariage, avec votre code à 4 chiffres si la galerie est protégée.</template>
    </p>
  </form>
</template>
