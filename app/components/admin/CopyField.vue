<script setup lang="ts">
const props = defineProps<{ label: string; value: string; hint?: string }>()
const toast = useToast()

async function copy() {
  try {
    await navigator.clipboard.writeText(props.value)
    toast.show('Copié')
  } catch {
    toast.show('Copie impossible : sélectionnez le texte manuellement.')
  }
}
</script>

<template>
  <div>
    <p class="field-label">{{ label }}</p>
    <div class="mt-2 flex items-stretch gap-2">
      <input :value="value" readonly class="field min-w-0 flex-1 truncate font-mono text-sm" :aria-label="label" @focus="($event.target as HTMLInputElement).select()">
      <button class="grid size-12 shrink-0 place-items-center border border-line transition-colors hover:bg-ink hover:text-paper" :aria-label="`Copier : ${label}`" @click="copy">
        <SoIcon name="copy" :size="18" />
      </button>
      <a :href="value" target="_blank" class="grid size-12 shrink-0 place-items-center border border-line transition-colors hover:bg-ink hover:text-paper" :aria-label="`Ouvrir : ${label}`">
        <SoIcon name="external" :size="18" />
      </a>
    </div>
    <p v-if="hint" class="mt-2 text-sm text-graphite">{{ hint }}</p>
  </div>
</template>
