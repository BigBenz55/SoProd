<script setup lang="ts">
const links = [
  { href: '#approche', label: 'L’approche' },
  { href: '#journee', label: 'La journée' },
  { href: '#prestations', label: 'Photo & film' },
  { href: '#galerie', label: 'Votre galerie' },
  { href: '#contact', label: 'Contact' },
]

const solid = ref(false)
const open = ref(false)

function onScroll() {
  solid.value = window.scrollY > window.innerHeight * 0.72
}
onMounted(() => {
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
})
onBeforeUnmount(() => window.removeEventListener('scroll', onScroll))

watch(open, (v) => {
  document.documentElement.style.overflow = v ? 'hidden' : ''
})
</script>

<template>
  <header
    class="fixed inset-x-0 top-0 z-50 transition-[background-color,color,box-shadow] duration-500 ease-out-expo"
    :class="solid ? 'bg-paper/95 text-ink shadow-[0_1px_0_var(--color-line)] backdrop-blur' : 'text-paper'"
  >
    <div class="mx-auto flex h-18 max-w-[88rem] items-center justify-between gap-6 px-5 sm:px-8">
      <a href="#top" class="text-[1.9rem] leading-none" aria-label="SoProd, retour en haut">
        <SoWordmark />
      </a>

      <nav class="hidden items-center gap-8 lg:flex" aria-label="Navigation principale">
        <a v-for="l in links" :key="l.href" :href="l.href" class="caps link-under py-1">{{ l.label }}</a>
      </nav>

      <div class="flex items-center gap-2">
        <a
          href="#acces"
          class="btn hidden px-5 py-3 sm:inline-flex"
          :class="solid ? 'btn-ink' : 'btn-line btn-line-inverse'"
        >
          <SoIcon name="lock" :size="16" />
          Ma galerie
        </a>
        <button
          class="grid size-12 place-items-center lg:hidden"
          :aria-expanded="open"
          aria-controls="menu-mobile"
          aria-label="Ouvrir le menu"
          @click="open = true"
        >
          <svg width="26" height="14" viewBox="0 0 26 14" aria-hidden="true">
            <path d="M0 1h26M6 13h20" stroke="currentColor" stroke-width="1.25" />
          </svg>
        </button>
      </div>
    </div>
  </header>

  <Transition
    enter-from-class="opacity-0"
    leave-to-class="opacity-0"
    enter-active-class="transition duration-500 ease-out-expo"
    leave-active-class="transition duration-300"
  >
    <div
      v-if="open"
      id="menu-mobile"
      class="fixed inset-0 z-[60] flex flex-col bg-ink px-6 pb-10 text-paper"
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      @keydown.esc="open = false"
    >
      <div class="flex h-18 items-center justify-between">
        <SoWordmark class="text-[1.9rem]" />
        <button class="grid size-12 place-items-center" aria-label="Fermer le menu" @click="open = false">
          <SoIcon name="close" :size="24" />
        </button>
      </div>
      <nav class="mt-10 flex flex-col gap-5" aria-label="Navigation mobile">
        <a
          v-for="(l, i) in links"
          :key="l.href"
          :href="l.href"
          class="display enter text-[2.6rem]"
          :style="{ animationDelay: `${80 + i * 60}ms` }"
          @click="open = false"
        >{{ l.label }}</a>
      </nav>
      <a href="#acces" class="btn-paper mt-auto" @click="open = false">
        <SoIcon name="lock" :size="16" />
        Accéder à ma galerie
      </a>
    </div>
  </Transition>
</template>
