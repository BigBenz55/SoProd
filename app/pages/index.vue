<script setup lang="ts">
const config = useRuntimeConfig()
const contactEmail = computed(() => config.public.contactEmail)
const instagram = computed(() => config.public.instagram || '')

const { data: demo } = await useFetch('/api/public/demo', { key: 'demo' })

const day = [
  { name: 'robe-boutons', caption: 'Les préparatifs', alt: 'Une mère boutonne le dos de la robe de la mariée près d’une fenêtre' },
  { name: 'ceremonie-eglise', caption: 'La cérémonie', alt: 'Les mariés à l’autel d’une église de pierre, vus depuis l’allée' },
  { name: 'sortie-confettis', caption: 'La sortie', alt: 'Les mariés rient sous une pluie de confettis à la sortie de l’église' },
  { name: 'premiere-danse', caption: 'La première danse', alt: 'Première danse des mariés dans une orangerie éclairée à la bougie' },
]

const demoTiles = [
  { name: 'portrait-voile', alt: 'Portrait de la mariée sous son voile' },
  { name: 'vin-honneur', alt: 'Les invités trinquent autour des mariés' },
  { name: 'alliances', alt: 'Les alliances posées sur un livre ouvert' },
  { name: 'couple-prairie', alt: 'Les mariés front contre front dans une prairie' },
  { name: 'diner-table', alt: 'La table du dîner éclairée à la bougie' },
  { name: 'sortie-etincelles', alt: 'Les mariés courent sous une haie d’étincelles' },
]
const hearts = ref<boolean[]>([true, false, false, true, false, false])
const heartCount = computed(() => hearts.value.filter(Boolean).length)

const promises = [
  {
    title: 'Un lien privé',
    text: 'Une adresse unique pour vous deux, protégée si vous le souhaitez par un code à quatre chiffres.',
  },
  {
    title: 'Vos favoris',
    text: 'Touchez le cœur des images que vous aimez. Votre sélection nous parvient telle quelle pour la retouche ou les tirages.',
  },
  {
    title: 'La pleine définition',
    text: 'Chaque photographie et chaque film se télécharge dans sa qualité d’origine, sans compression.',
  },
  {
    title: 'Un lien pour les invités',
    text: 'Vos proches parcourent la galerie en définition réduite. Le téléchargement des originaux reste fermé, sauf si vous l’ouvrez.',
  },
]

useSeoMeta({
  title: 'SoProd — Photographie & film de mariage en noir et blanc',
  ogTitle: 'SoProd — Photographie & film de mariage',
  ogDescription: 'Des images en noir et blanc, livrées dans une galerie privée qui n’appartient qu’à vous.',
  ogImage: '/images/hero-allee-1920.webp',
})
</script>

<template>
  <div id="top">
    <SiteHeader />

    <!-- Hero : la photographie sous son papier cristal -->
    <section class="relative h-svh min-h-[40rem] overflow-hidden bg-ink" aria-labelledby="hero-titre">
      <SoPhoto
        name="hero-allee"
        alt="Deux jeunes mariés marchent main dans la main dans une longue allée d’arbres menant à un château"
        eager
        class="photo-settle absolute inset-0 size-full object-cover object-[50%_60%]"
      />
      <div class="absolute inset-0 bg-[linear-gradient(to_bottom,rgb(0_0_0/0.45),transparent_30%,transparent_65%,rgb(0_0_0/0.5))]" />

      <div class="relative flex h-full items-center justify-center px-5 pt-16">
        <div class="vellum vellum-lift w-full max-w-[40rem] px-7 py-12 text-center text-ink sm:px-14 sm:py-16">
          <SoMonogram :size="64" class="enter mx-auto" />
          <h1 id="hero-titre" class="enter mt-7 text-[clamp(3.6rem,12vw,6rem)] [animation-delay:120ms]">
            <SoWordmark />
          </h1>
          <div class="rule-double mx-auto mt-6 w-20" />
          <p class="caps enter mt-6 [animation-delay:240ms]">Photographie &amp; film de mariage</p>
          <p class="enter mx-auto mt-6 max-w-[26rem] text-graphite [animation-delay:320ms]">
            Des images en noir et blanc, livrées dans une galerie privée qui n’appartient qu’à vous.
          </p>
          <div class="enter mt-9 flex flex-col justify-center gap-3 sm:flex-row [animation-delay:400ms]">
            <a href="#acces" class="btn-ink">
              <SoIcon name="lock" :size="16" />
              Accéder à ma galerie
            </a>
            <a href="#approche" class="btn-line">Découvrir SoProd</a>
          </div>
        </div>
      </div>

      <p class="caps absolute bottom-5 right-5 text-paper/70 sm:right-8">Image de démonstration</p>
    </section>

    <!-- L’approche -->
    <section id="approche" class="scroll-mt-18 bg-paper px-5 py-28 sm:px-8 lg:py-40">
      <div class="mx-auto grid max-w-[80rem] items-center gap-16 lg:grid-cols-12 lg:gap-10">
        <div class="lg:col-span-6 lg:col-start-1">
          <h2 class="display text-[clamp(2.8rem,6.4vw,5.6rem)]">
            Le jour passe.<br>
            <em>Les images</em> restent.
          </h2>
          <div class="mt-12 max-w-[34rem] space-y-5 text-[1.075rem] text-graphite">
            <p>
              SoProd photographie et filme les mariages avec une conviction simple : le noir et blanc ne retire rien,
              il garde l’essentiel. Les regards, les mains, la lumière d’une fenêtre, l’instant où tout le monde rit en même temps.
            </p>
            <p>
              Pendant la journée, on se fait oublier. Ensuite, on prend le temps de choisir, de retoucher,
              puis de vous confier chaque image en pleine définition.
            </p>
          </div>
          <div class="mt-12 flex items-center gap-5">
            <SoMonogram :size="44" />
            <p class="caps text-graphite">Noir, blanc, et rien d’autre</p>
          </div>
        </div>
        <figure class="relative lg:col-span-5 lg:col-start-8">
          <SoPhoto
              name="portrait-voile"
              alt="Portrait de profil d’une mariée derrière son voile, lumière de fenêtre"
              sizes="(min-width: 1024px) 40vw, 100vw"
              class="aspect-[3/4] w-full object-cover grayscale"
            />
          <div class="absolute -bottom-6 -left-6 hidden h-40 w-40 border border-line-strong lg:block" aria-hidden="true" />
        </figure>
      </div>
    </section>

    <!-- La journée -->
    <section id="journee" class="grain relative scroll-mt-18 bg-ink px-5 py-28 text-paper sm:px-8 lg:py-40">
      <div class="mx-auto max-w-[88rem]">
        <div class="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <h2 class="display max-w-[16ch] text-[clamp(2.6rem,5.6vw,5rem)]">
            Du premier bouton à la <em>dernière danse</em>.
          </h2>
          <p class="max-w-[30rem] text-silver">
            Une journée racontée dans l’ordre où vous l’avez vécue. Rien n’est mis en scène, tout est regardé.
          </p>
        </div>

        <div class="mt-20 grid gap-x-6 gap-y-14 md:grid-cols-12">
          <figure class="md:col-span-5">
            <SoPhoto :name="day[0]!.name" :alt="day[0]!.alt" sizes="(min-width: 768px) 40vw, 100vw" class="aspect-[3/4] w-full object-cover" />
            <figcaption class="caps mt-4 text-silver">{{ day[0]!.caption }}</figcaption>
          </figure>
          <figure class="md:col-span-6 md:col-start-7 md:mt-40">
            <SoPhoto :name="day[1]!.name" :alt="day[1]!.alt" sizes="(min-width: 768px) 48vw, 100vw" class="aspect-[4/5] w-full object-cover" />
            <figcaption class="caps mt-4 text-silver">{{ day[1]!.caption }}</figcaption>
          </figure>
          <figure class="md:col-span-7 md:col-start-2 md:-mt-10">
            <SoPhoto :name="day[2]!.name" :alt="day[2]!.alt" sizes="(min-width: 768px) 56vw, 100vw" class="aspect-[4/3] w-full object-cover" />
            <figcaption class="caps mt-4 text-silver">{{ day[2]!.caption }}</figcaption>
          </figure>
          <figure class="md:col-span-4 md:col-start-9 md:mt-32">
            <SoPhoto :name="day[3]!.name" :alt="day[3]!.alt" sizes="(min-width: 768px) 32vw, 100vw" class="aspect-[3/4] w-full object-cover" />
            <figcaption class="caps mt-4 text-silver">{{ day[3]!.caption }}</figcaption>
          </figure>
        </div>
      </div>
    </section>

    <!-- Photo & film -->
    <section id="prestations" class="scroll-mt-18 bg-paper px-5 py-28 sm:px-8 lg:py-40">
      <div class="mx-auto max-w-[80rem]">
        <h2 class="display text-center text-[clamp(2.6rem,5.6vw,5rem)]">Photo <em>&amp;</em> film</h2>
        <div class="rule-double mx-auto mt-8 w-24" />

        <div class="mt-20 grid gap-20 md:grid-cols-2 md:gap-12 lg:gap-20">
          <article>
            <SoPhoto name="alliances" alt="Deux alliances posées sur un livre ouvert, près d’un bouquet de roses blanches" sizes="(min-width: 768px) 45vw, 100vw" class="aspect-square w-full object-cover" />
            <h3 class="display mt-10 text-[2.6rem]">Photographie</h3>
            <ul class="mt-6 divide-y divide-line border-y border-line">
              <li class="py-4">Le reportage de la journée, des préparatifs à la soirée</li>
              <li class="py-4">Les portraits de couple, à la lumière du soir</li>
              <li class="py-4">Une sélection retouchée image par image</li>
            </ul>
          </article>
          <article class="md:mt-32">
            <SoPhoto name="sortie-etincelles" alt="Les mariés courent en riant sous une haie d’étincelles tenues par leurs invités" sizes="(min-width: 768px) 45vw, 100vw" class="aspect-[4/5] w-full object-cover" />
            <h3 class="display mt-10 text-[2.6rem]">Film</h3>
            <ul class="mt-6 divide-y divide-line border-y border-line">
              <li class="py-4">Le film de la journée, monté et étalonné en noir et blanc</li>
              <li class="py-4">Les vœux, les discours et la première danse</li>
              <li class="py-4">Une lecture fluide sur téléphone, le fichier original en téléchargement</li>
            </ul>
          </article>
        </div>
      </div>
    </section>

    <!-- Votre galerie -->
    <section id="galerie" class="grain relative scroll-mt-18 bg-ink px-5 py-28 text-paper sm:px-8 lg:py-40">
      <div class="mx-auto grid max-w-[88rem] gap-20 lg:grid-cols-12 lg:gap-10">
        <div class="lg:col-span-5">
          <h2 class="display text-[clamp(2.6rem,5.6vw,5rem)]">Votre galerie, <em>rien qu’à vous</em>.</h2>
          <p class="mt-8 max-w-[30rem] text-silver">
            Pas de plateforme tierce, pas de logo étranger : vos images sont conservées par SoProd
            et vous sont livrées dans un écrin à votre nom.
          </p>
          <dl class="mt-14 divide-y divide-line-inverse border-y border-line-inverse">
            <div v-for="p in promises" :key="p.title" class="grid gap-2 py-6 sm:grid-cols-[11rem_1fr] sm:gap-8">
              <dt class="display text-[1.45rem] leading-tight">{{ p.title }}</dt>
              <dd class="text-silver">{{ p.text }}</dd>
            </div>
          </dl>
        </div>

        <div class="lg:col-span-6 lg:col-start-7">
          <div class="bg-paper p-3 text-ink shadow-[0_40px_80px_-40px_rgb(0_0_0/0.8)] sm:p-4">
            <div class="flex items-center justify-between gap-4 px-2 pb-4 pt-1">
              <p class="display text-xl">Claire <em>&amp;</em> Antoine</p>
              <p class="caps flex items-center gap-2" aria-live="polite">
                <SoIcon name="heart" :size="14" filled />
                {{ heartCount }} favori{{ heartCount > 1 ? 's' : '' }}
              </p>
            </div>
            <ul class="grid grid-cols-3 gap-1.5">
              <li v-for="(t, i) in demoTiles" :key="t.name" class="group relative">
                <img :src="`/images/${t.name}-960.webp`" :alt="t.alt" loading="lazy" class="aspect-[4/5] w-full object-cover">
                <button
                  class="absolute bottom-1.5 right-1.5 grid size-10 place-items-center text-paper drop-shadow-[0_1px_4px_rgb(0_0_0/0.6)] transition-transform duration-300 ease-out-expo active:scale-90"
                  :aria-pressed="hearts[i]"
                  :aria-label="hearts[i] ? 'Retirer des favoris' : 'Ajouter aux favoris'"
                  @click="hearts[i] = !hearts[i]"
                >
                  <SoIcon name="heart" :size="22" :filled="hearts[i]" />
                </button>
              </li>
            </ul>
            <p class="caps px-2 pt-4 text-graphite">Aperçu interactif — touchez les cœurs</p>
          </div>

          <div class="mt-10 flex flex-col gap-3 sm:flex-row">
            <NuxtLink v-if="demo" :to="`/g/${demo.privateToken}`" class="btn-paper">
              <SoIcon name="eye" :size="16" />
              Ouvrir la galerie de démonstration
            </NuxtLink>
            <a href="#acces" class="btn-line btn-line-inverse">J’ai reçu mon lien</a>
          </div>
        </div>
      </div>
    </section>

    <!-- Accès -->
    <section id="acces" class="relative scroll-mt-18 overflow-hidden bg-mist px-5 py-28 sm:px-8 lg:py-36">
      <SoPhoto name="couple-prairie" alt="" sizes="100vw" class="absolute inset-0 size-full object-cover opacity-90" />
      <div class="relative mx-auto max-w-[40rem]">
        <div class="vellum px-7 py-12 sm:px-14 sm:py-16">
          <SoMonogram :size="52" class="mx-auto" />
          <h2 class="display mt-8 text-center text-[clamp(2.2rem,5vw,3.4rem)]">Accéder à votre galerie</h2>
          <div class="rule-double mx-auto mb-10 mt-6 w-16" />
          <GalleryAccessForm />
        </div>
      </div>
    </section>

    <!-- Contact -->
    <footer id="contact" class="grain relative scroll-mt-18 bg-ink px-5 pb-10 pt-28 text-paper sm:px-8 lg:pt-40">
      <div class="mx-auto max-w-[88rem]">
        <h2 class="display max-w-[14ch] text-[clamp(2.8rem,7vw,6rem)]">Parlons de <em>votre</em> mariage.</h2>
        <div class="mt-14 flex flex-col gap-6 sm:flex-row sm:items-center">
          <a v-if="contactEmail" :href="`mailto:${contactEmail}`" class="btn-paper">
            <SoIcon name="mail" :size="16" />
            {{ contactEmail }}
          </a>
          <p v-else class="caps border border-dashed border-line-inverse px-5 py-4 text-silver">
            Adresse de contact à renseigner (NUXT_PUBLIC_CONTACT_EMAIL)
          </p>
          <a v-if="instagram" :href="`https://instagram.com/${instagram.replace(/^@/, '')}`" class="caps link-under" rel="noopener" target="_blank">
            Instagram {{ instagram }}
          </a>
        </div>

        <div class="mt-28 flex flex-col gap-6 border-t border-line-inverse pt-8 text-sm text-silver md:flex-row md:items-center md:justify-between">
          <SoWordmark class="text-[2.4rem] text-paper" />
          <p>Photographies de démonstration, à remplacer par vos images.</p>
          <div class="flex items-center gap-8">
            <p>© {{ new Date().getFullYear() }} SoProd</p>
            <NuxtLink to="/admin" class="caps link-under">Espace photographe</NuxtLink>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>
