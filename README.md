# SoProd

Plateforme privée de livraison photo & vidéo pour les mariés : vitrine, galeries clients, back-office photographe.
Alternative auto-hébergée à Pixieset — originaux stockés sur le disque de la Box, miniatures WebP en cache sur l’hébergement.

## Démarrer en local

```bash
npm install
cp .env.example .env      # puis renseignez NUXT_ADMIN_PASSWORD et NUXT_SESSION_SECRET
npm run dev               # http://localhost:3000
```

- Vitrine : `/`
- Back-office : `/admin` (mot de passe = `NUXT_ADMIN_PASSWORD`)
- En mode `local`, une galerie de démonstration « Claire & Antoine » est créée et indexée au premier lancement à partir de `demo-box/`.

`npm run demo:seed` régénère `demo-box/` et `public/images/` depuis `scripts/demo-source/` (images de démonstration générées).

## Fonctionnement

| Élément | Où |
|---|---|
| Originaux (JPG, MP4…) | Disque de la Box, via FTP/FTPS ou SFTP (`NUXT_STORAGE_DRIVER`) |
| Miniatures WebP (grille 800 px, visionneuse 2048 px ≈ 100–250 Ko, invités 1280 px) | `.data/cache/<galerie>/` |
| Base de données (SQLite) | `.data/soprod.db` |

- Les galeries ne chargent jamais d’image depuis la Box : seul le clic « Télécharger » ou la lecture d’un film passe par le serveur, en streaming (plages HTTP), sans jamais exposer l’adresse de la Box.
- Box hors ligne : la consultation continue grâce au cache, les téléchargements affichent un message d’attente.
- Lien privé (mariés) : UUID, code PIN à 4 chiffres facultatif, favoris, téléchargement HD. Lien public (invités) : définition réduite, téléchargement des originaux activable.
- Validité du lien par galerie : 30, 60, 90 jours ou **sans expiration** (back-office › galerie › « Validité du lien »).
- Film : placez une image de même nom à côté du fichier (`film.mp4` + `film.jpg`) pour servir d’affiche.
- Export Lightroom : Bibliothèque › Filtre texte › Nom de fichier › Contient, puis collez la première ligne du `.txt`.

## Brancher la Box (jalon 1 du cahier des charges)

1. Branchez le disque sur la Box et activez son serveur FTP (idéalement FTPS) ou SFTP, avec un compte dédié en lecture seule.
2. Configurez un DNS dynamique (DuckDNS, No-IP… ou celui intégré à la Box) pour obtenir un nom fixe, par exemple `monstudio.duckdns.org`.
3. Redirigez le port FTP/SFTP (et la plage de ports passifs en FTP) vers la Box. Si possible, limitez l’accès à l’adresse IP de l’hébergement.
4. Renseignez dans `.env` : `NUXT_STORAGE_DRIVER=ftp` (ou `sftp`), `NUXT_STORAGE_HOST`, `NUXT_STORAGE_PORT`, `NUXT_STORAGE_USER`, `NUXT_STORAGE_PASSWORD`, `NUXT_STORAGE_SECURE=true`, `NUXT_STORAGE_ROOT`.
5. Dans le back-office, le témoin en haut à droite indique si la Box répond.

## Déployer

Le cahier des charges prévoyait PHP sur un hébergement mutualisé Hostinger ; ce projet est en **Nuxt (Node.js)**. Il faut donc une offre Hostinger qui exécute Node.js (hébergement « Business / Cloud » avec applications Node.js, ou un VPS).

```bash
npm run build
node .output/server/index.mjs     # écoute sur PORT (3000 par défaut)
```

Variables à définir sur le serveur : celles de `.env.example`. Le dossier `NUXT_DATA_DIR` doit être persistant et inscriptible. Node.js ≥ 22.19 est recommandé (Nuxt 4.5).

## À remplacer avant la mise en ligne

- Les photographies de démonstration (`public/images/`, `demo-box/`) par vos images.
- L’adresse de contact (`NUXT_PUBLIC_CONTACT_EMAIL`, sinon un emplacement « à renseigner » s’affiche) et Instagram (`NUXT_PUBLIC_INSTAGRAM`).
- Les textes de la vitrine (`app/pages/index.vue`) : approche, prestations photo et film.
- Le mot de passe administrateur et la clé de session.
