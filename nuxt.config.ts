import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2026-09-01',
  devtools: { enabled: false },
  css: ['~/assets/css/main.css'],

  app: {
    head: {
      htmlAttrs: { lang: 'fr' },
      title: 'SoProd — Photographie & film de mariage',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'theme-color', content: '#0b0b0b' },
        { name: 'description', content: 'SoProd, photographie et film de mariage en noir et blanc. Galeries privées pour les jeunes mariés et leurs invités.' },
      ],
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    },
  },

  runtimeConfig: {
    adminPassword: '',
    sessionSecret: '',
    dataDir: './.data',
    /** mysql://user:pass@host:3306/nom_base — prioritaire sur NUXT_DB_MYSQL_* si défini */
    databaseUrl: process.env.NUXT_DATABASE_URL || process.env.DATABASE_URL || '',
    db: {
      driver: 'sqlite',
      mysql: {
        host: '',
        port: 3306,
        database: '',
        user: '',
        password: '',
      },
    },
    storage: {
      driver: 'local',
      root: './demo-box',
      host: '',
      port: 0,
      user: '',
      password: '',
      secure: false,
      privateKeyPath: '',
    },
    public: {
      siteName: 'SoProd',
      contactEmail: '',
      instagram: '',
    },
  },

  routeRules: {
    '/admin/**': { ssr: false, robots: false },
    '/g/**': { robots: false },
  },

  nitro: {
    externals: { external: ['sharp', 'ssh2', 'ssh2-sftp-client', 'mysql2'] },
  },

  vite: {
    plugins: [tailwindcss()],
  },
})
