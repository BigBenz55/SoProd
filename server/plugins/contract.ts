const CONTRACT = `<!--
THESIS: SoProd dresses for black tie: every photograph arrives under a vellum interleaf that lifts as you scroll, like the tissue in a wedding album. It refuses cream-and-script romance and the dark neon portfolio.
OWN-WORLD: pure ink #0b0b0b and paper white only; Bodoni Moda didone display with an italic "So" and italic ampersands; Jost letterpress small capitals on controls; hairline and engraved double rules; frosted vellum sheets; square corners; film grain on black fields.
STORY: couples see the studio's eye, understand their private gallery (link, PIN, hearts, HD, guests), open the live demo, then reach their own gallery.
FIRST VIEWPORT: full-bleed B&W alley photograph; centred vellum card with monogram, wordmark up to 6rem, "Photographie & film de mariage", primary "Accéder à ma galerie"; slim nav above with "Ma galerie" at right.
FORM: brief-pinned (noir et blanc chic, jeunes mariés); concept roll not run because the user pinned the world; seed: none.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
-->`

export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook('render:html', (html) => {
    html.bodyPrepend.unshift(CONTRACT)
  })
})
