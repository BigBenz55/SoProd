<script setup lang="ts">
const props = defineProps<{ token: string; name: string; eventDate: string | null }>()
const emit = defineEmits<{ unlocked: [] }>()

const pin = ref('')
const error = ref('')
const busy = ref(false)
const input = ref<HTMLInputElement | null>(null)
const veilLoaded = ref(false)
const veil = ref<HTMLImageElement | null>(null)

onMounted(() => {
  input.value?.focus()
  if (veil.value?.complete && veil.value.naturalWidth) veilLoaded.value = true
})

watch(pin, (v) => {
  const clean = v.replace(/\D/g, '').slice(0, 4)
  if (clean !== v) pin.value = clean
  if (clean.length === 4) submit()
  else if (clean.length > 0) error.value = ''
})

async function submit() {
  if (busy.value || pin.value.length !== 4) return
  busy.value = true
  error.value = ''
  try {
    await $fetch(`/api/g/${props.token}/unlock`, { method: 'POST', body: { pin: pin.value } })
    emit('unlocked')
  } catch (err) {
    error.value = errorMessage(err, 'Ce code ne correspond pas.')
    pin.value = ''
    input.value?.focus()
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <main class="grain relative grid min-h-svh place-items-center overflow-hidden bg-ink px-5 py-16 text-ink">
    <img
      ref="veil"
      :src="`/api/g/${token}/veil`"
      alt=""
      aria-hidden="true"
      class="photo-settle absolute inset-0 size-full scale-110 object-cover blur-2xl transition-opacity duration-[1.5s]"
      :class="veilLoaded ? 'opacity-70' : 'opacity-0'"
      @load="veilLoaded = true"
      @error="veilLoaded = false"
    >
    <form class="vellum relative w-full bg-paper/85 max-w-[32rem] px-7 py-14 text-center sm:px-14" @submit.prevent="submit">
      <SoMonogram :size="56" class="mx-auto" />
      <h1 class="display mt-8 text-[clamp(2.4rem,8vw,3.4rem)]"><GalleryNames :name="name" /></h1>
      <div class="rule-double mx-auto mt-6 w-16" />
      <p v-if="eventDate" class="mt-5 text-graphite">{{ formatDate(eventDate) }}</p>

      <label for="pin" class="mt-10 block text-graphite">Saisissez le code à 4 chiffres reçu avec votre lien.</label>
      <div class="relative mx-auto mt-6 w-fit" @click="input?.focus()">
        <input
          id="pin"
          ref="input"
          v-model="pin"
          type="text"
          inputmode="numeric"
          autocomplete="one-time-code"
          pattern="\d{4}"
          maxlength="4"
          class="absolute inset-0 size-full cursor-text opacity-0"
          :aria-invalid="Boolean(error)"
          aria-describedby="pin-message"
          :disabled="busy"
        >
        <div class="flex gap-3" aria-hidden="true">
          <span
            v-for="i in 4"
            :key="i"
            class="display grid h-16 w-13 place-items-center text-[2rem] transition-[box-shadow] duration-300"
            :class="pin.length === i - 1 && !busy ? 'shadow-[inset_0_-2px_0_var(--color-ink)]' : 'shadow-[inset_0_-1px_0_var(--color-line-strong)]'"
          >{{ pin[i - 1] ? '•' : '' }}</span>
        </div>
      </div>
      <p id="pin-message" class="mt-6 min-h-6 text-sm" role="alert">{{ error }}</p>
      <button type="submit" class="btn-ink mt-4 w-full sm:w-auto" :disabled="busy || pin.length !== 4">
        <SoIcon name="lock" :size="16" />
        {{ busy ? 'Vérification…' : 'Ouvrir la galerie' }}
      </button>
    </form>
  </main>
</template>
