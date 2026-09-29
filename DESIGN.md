---
name: SoProd
description: Black-and-white wedding photography and film, delivered in a private gallery the couple owns.
colors:
  ink: "#0b0b0b"
  satin: "#151515"
  paper: "#ffffff"
  mist: "#f3f3f2"
  graphite: "#5b5b5b"
  silver: "#a9a9a9"
  line: "rgb(11 11 11 / 0.12)"
  line-strong: "rgb(11 11 11 / 0.28)"
  line-inverse: "rgb(255 255 255 / 0.18)"
typography:
  display:
    fontFamily: "'Bodoni Moda Variable', 'Bodoni 72', 'Didot', serif"
    fontSize: "clamp(3.6rem, 12vw, 6rem)"
    fontWeight: 400
    lineHeight: 0.95
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "'Bodoni Moda Variable', 'Bodoni 72', 'Didot', serif"
    fontSize: "clamp(2.6rem, 5.6vw, 5rem)"
    fontWeight: 400
    lineHeight: 0.95
    letterSpacing: "-0.02em"
  title:
    fontFamily: "'Bodoni Moda Variable', 'Bodoni 72', 'Didot', serif"
    fontSize: "2.6rem"
    fontWeight: 400
    lineHeight: 0.95
    letterSpacing: "-0.02em"
  panel-title:
    fontFamily: "'Bodoni Moda Variable', 'Bodoni 72', 'Didot', serif"
    fontSize: "1.5rem"
    fontWeight: 400
    letterSpacing: "-0.02em"
  body:
    fontFamily: "'Jost Variable', 'Futura', 'Avenir Next', system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 380
    lineHeight: 1.6
  body-lead:
    fontFamily: "'Jost Variable', 'Futura', 'Avenir Next', system-ui, sans-serif"
    fontSize: "1.075rem"
    fontWeight: 380
    lineHeight: 1.6
  body-sm:
    fontFamily: "'Jost Variable', 'Futura', 'Avenir Next', system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 380
    lineHeight: 1.6
  label:
    fontFamily: "'Jost Variable', 'Futura', 'Avenir Next', system-ui, sans-serif"
    fontSize: "0.72rem"
    fontWeight: 450
    lineHeight: 1.4
    letterSpacing: "0.24em"
rounded:
  none: "0px"
spacing:
  gallery-gap: "6px"
  gallery-gap-wide: "8px"
  control-gap: "12px"
  gutter: "20px"
  gutter-wide: "32px"
  panel: "24px"
  panel-wide: "32px"
  section: "112px"
  section-wide: "160px"
components:
  button-ink:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "16px 28px"
    height: "48px"
  button-ink-hover:
    backgroundColor: "{colors.satin}"
    textColor: "{colors.paper}"
  button-paper:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "16px 28px"
    height: "48px"
  button-paper-hover:
    backgroundColor: "{colors.mist}"
    textColor: "{colors.ink}"
  button-line:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "16px 28px"
    height: "48px"
  button-line-hover:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
  button-line-inverse-hover:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
  field:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: "12px 0"
  vellum-card:
    backgroundColor: "rgb(255 255 255 / 0.72)"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "64px 56px"
    width: "40rem"
  panel:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "{spacing.panel-wide}"
  gallery-bar:
    backgroundColor: "rgb(255 255 255 / 0.95)"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    height: "48px"
  toast:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "12px 20px"
---

# Design System: SoProd

## Overview

**Creative North Star: "The Black-Tie Album"**

SoProd dresses for black tie. The interface behaves like a bound wedding album: the opening photograph arrives under a sheet of frosted vellum that lifts away as you scroll, the way the tissue interleaf lifts from a print. Photographs below the fold are never veiled; they show immediately. The palette is ink and paper only. Display type is a high-contrast didone cut like an engraved invitation. Controls are set in spaced letterpress small capitals. Rules are hairlines or engraved double rules. Nothing is rounded. The photographs carry all the tone; the chrome recedes into black, white and a few greys.

Density follows the surface. The public showcase is spacious and editorial: section padding of 7 to 10rem, asymmetric 12-column compositions, and photographs offset down the grid like prints laid on a table. The client gallery is dense and quiet: a tight masonry wall with 6–8px gutters under a sticky paper bar. The back-office (Operate mode) uses the same tokens: a mist ground, square paper panels, hairline dividers and the same buttons, with display type kept to panel titles.

The system rejects two things: cream-and-script wedding romance (no ivory, blush, gold or calligraphy) and the dark neon portfolio (no glow, no accent hue, no gradient chrome).

**Key Characteristics:**
- Pure ink (#0b0b0b) and paper (#ffffff); greys only for secondary text and hairlines.
- Bodoni Moda at display sizes, with one italic turn per headline; the "So" of the wordmark and every ampersand are italic.
- Jost small capitals (0.72rem, 0.24em tracking) on every control and piece of metadata.
- Frosted vellum sheets over photographs, lifted by scroll-driven animation.
- Square corners everywhere; hairline and engraved double rules instead of boxes.
- Film grain on black fields.

## Colors

A strictly achromatic palette: ink and paper do all the work, three greys handle hierarchy, and hue exists only inside the photographs.

### Primary
- **Ink** (#0b0b0b): The black of black tie. Text on paper, primary button fill, full-bleed black sections (the day story, the gallery pitch, the footer), the lightbox, the mobile menu, the admin header bar, toasts and selection highlight. It is never pure #000; the slight lift keeps grain and hairlines visible.

### Secondary
- **Satin** (#151515): Ink one step up. Used only as the hover fill of ink buttons, the sheen of satin under a lapel.

### Neutral
- **Paper** (#ffffff): The page. Default body ground, paper buttons on black fields, admin panels, sticky bars (at 95% with blur), and the base of vellum (at 72%).
- **Mist** (#f3f3f2): The admin ground under paper panels, paper-button hover, image placeholders and loading skeletons.
- **Graphite** (#5b5b5b): Secondary text on paper and mist: lead paragraphs, hints, captions, inactive filter tabs, field labels, placeholders.
- **Silver** (#a9a9a9): Secondary text on ink: body copy, captions and meta in black sections and the lightbox.
- **Hairline** (rgb 11 11 11 / 0.12): Dividers between list rows, bar underlines, the border of segmented controls and icon buttons.
- **Hairline Strong** (rgb 11 11 11 / 0.28): Resting underline of fields and PIN cells, the demo tag border, off-state toggle track.
- **Hairline Inverse** (rgb 255 255 255 / 0.18): Dividers and field underlines on ink.

### Named Rules
**The Ink and Paper Rule.** The interface carries no hue. Any new colour token has to be a grey between ink and paper or a translucency of one of them. States are expressed by inverting ink and paper, never by tinting.

**The Quiet Error Rule.** Errors turn from graphite to ink and say what to do. There is no red; the message's wording and its position under the field carry the alarm.

## Typography

**Display Font:** Bodoni Moda Variable (with Bodoni 72, Didot, serif), optical sizing on
**Body Font:** Jost Variable (with Futura, Avenir Next, system-ui, sans-serif)
**Label/Mono Font:** Jost in small capitals for labels; the platform monospace only for file paths, share URLs and Lightroom filename lists in the back-office

**Character:** An engraved invitation (a didone with hairline serifs and deep stress) set against a geometric sans that reads like a letterpress reply card. Body weight sits at 380, lighter than regular, so paragraphs stay as quiet as the photographs.

### Hierarchy
- **Display** (400, clamp(3.6rem, 12vw, 6rem), 0.95): The wordmark on the hero vellum card and the contact sign-off. One per page.
- **Headline** (400, clamp(2.6rem, 5.6vw, 5rem), 0.95): Showcase section headings; the gallery cover names (clamp to 5.2rem); page titles in admin (clamp(2.4–2.6rem, 6vw, 3.8rem)).
- **Title** (400, 2.6rem, 0.95): Sub-section headings such as "Photographie" and "Film", and mobile menu links.
- **Panel Title** (400, 1.5rem): Admin panel headings and the gallery bar name; the 1.45rem promise terms sit at this step.
- **Body** (380, 1rem, 1.6): All running text. Paragraphs wrap with `pretty`, headings with `balance`; measure is held between 26rem and 34rem.
- **Body Lead** (380, 1.075rem, 1.6): Graphite introductory prose in the showcase.
- **Body Small** (380, 0.875rem, 1.6): Hints under fields, admin meta lines, footer notes.
- **Label** (450, 0.72rem, 0.24em, uppercase): Buttons, navigation, filter tabs, field labels, captions, counters, status and toasts.

### Named Rules
**The Italic Turn Rule.** Each display heading turns into italic once, on the phrase that carries its feeling ("*Les images* restent", "la *dernière danse*"). The "So" of the wordmark is always italic, and so is every ampersand between names or nouns ("Claire *&* Antoine", "Photo *&* film"). Never set a whole heading in italic.

**The Caps Below Rule.** Small capitals label controls and metadata; they never sit above a heading. A heading's context (event type, date, "Photographie & film de mariage") comes after it, below the engraved double rule.

**The Didone Floor Rule.** Bodoni is display-only: nothing smaller than the 1.25rem gallery bar name. Below that, everything is Jost.

## Layout

The showcase uses full-width bands that alternate paper and ink, each padded 7rem vertically (10rem at `lg`) with 20px side gutters (32px from `sm`). Content sits in centred containers of 80rem (paper sections) or 88rem (ink sections, header, footer). Compositions use a 12-column grid at `lg`/`md` with deliberate asymmetry: text on columns 1–6 against an image on 8–12; the day story drops figures by 8–10rem offsets (`mt-40`, `mt-32`, `-mt-10`) so prints stagger like a contact sheet laid out by hand.

First viewports are full-bleed photographs at `100svh` (minimum 36–40rem) with one centred vellum card, 38–40rem wide, padded 48px × 28px on phones and 64px × 56px from `sm`. A slim 4.5rem header floats above.

The client gallery switches to density: a masonry wall capped at 120rem, 6px gutters (8px from `sm`), with shortest-column packing into 2, 3, 4 or 5 columns at container widths below 560px, 1000px and 1600px, and above. A 48px-tall filter bar sticks to the top.

The admin shell is an 80rem container on mist with a 4rem ink header, 24px/32px panel padding, and a 12-column split of 7 + 5 panels at `lg`.

Breakpoints are Tailwind's defaults (`sm` 640px, `md` 768px, `lg` 1024px). The inner rhythm leans on 12px control gaps, 24–40px between a heading and its content, and 56–80px between blocks.

## Elevation & Depth

Depth comes from material, not from stacked cards. Surfaces are flat and square at rest. There are three kinds of depth: **vellum** (translucent frosted paper over a photograph, with a long, soft shadow), **inversion** (ink bands and overlays against paper), and **grain** (a 7% screen-blended fractal noise over ink fields). Photographs under text get a vertical scrim: black at 35–45% at the top, clear through the middle, 50–55% at the foot.

### Shadow Vocabulary
- **Vellum lift** (`box-shadow: 0 30px 80px -30px rgb(0 0 0 / 0.45)`): Only under the vellum card that floats over a photograph.
- **Hairline under** (`box-shadow: 0 1px 0 var(--color-line)`): Sticky paper bars (the showcase header once solid, the gallery filter bar).
- **Toast drop** (`box-shadow: 0 12px 30px -12px rgb(0 0 0 / 0.5)`): Ink toasts at the bottom of the screen.
- **Icon lift** (`filter: drop-shadow(0 1px 4px rgb(0 0 0 / 0.6))`): Paper-coloured icons (hearts) placed directly on photographs, for legibility.

### Named Rules
**The Vellum Only Rule.** Frosting appears in exactly three recipes: vellum (paper at 72%, blur 14px, saturation 0.4), dark vellum (ink at 55%, blur 16px, saturation 0.3) and sticky bars (paper at 95% with blur). Vellum always lies over a photograph; frosting over a flat colour is not vellum.

**The Grain on Black Rule.** Every ink field large enough to read as a surface (section bands, the lightbox, the PIN gate) carries film grain. Paper fields never do.

## Shapes

The form language is square and engraved. All rectangles have 0px corners: buttons, fields, cards, panels, thumbnails, toasts, segmented controls. Borders are 1px hairlines drawn as inset box-shadows on buttons and fields, so the outline never shifts layout. The signature divider is the **engraved double rule**: two 1px lines 2px apart (4px total) at 35% of the current colour, 4–6rem wide and centred under a heading. True circles are allowed where the object is itself round: the monogram's double engraved ring, the storage status dot and the video play ring.

## Components

### Buttons
Letterpress capitals in a square slab; confident and still.
- **Shape:** Square (0px), minimum 48px tall, padded 16px × 28px (12px × 20px in compact admin and header use), icon and label separated by 12px.
- **Ink (primary):** Ink fill, paper label, with an inset 1px ink edge. One per view: "Accéder à ma galerie", "Ouvrir la galerie", "Nouvelle galerie", "Enregistrer".
- **Paper:** Paper fill, ink label; the primary action on ink fields.
- **Line (secondary):** Transparent with an inset 1px outline in the current colour; on hover it fills with ink (or with paper on ink fields, the inverse variant).
- **Hover / Focus:** 300ms colour transition on the quart ease-out curve. Ink goes to satin, paper to mist. Focus is a 1px current-colour outline offset 4px. Disabled is 40% opacity with a not-allowed cursor.
- **Text links:** Caps labels with an underline drawn from the left in 500ms (expo ease-out), which stays drawn for the current page or tab.

### Cards / Containers
- **Corner Style:** Square (0px).
- **Background:** Vellum over photographs; plain paper for admin panels, list rows and the showcase's demo gallery sheet.
- **Shadow Strategy:** Vellum lift only on vellum; admin panels are flat on mist and separated by 24px gaps.
- **Border:** None on panels. Lists are divided by hairline rules, bordered top and bottom.
- **Internal Padding:** Vellum 48px × 28px up to 64px × 56px; admin panels 24px up to 32px.

### Inputs / Fields
- **Style:** Underline-only. Transparent ground, no box, 12px vertical padding, a 1px hairline-strong underline. The label sits above in graphite caps.
- **Focus:** The underline thickens to 2px ink over 300ms. On ink fields it goes from hairline inverse to 2px paper.
- **PIN entry:** Four 52 × 64px Bodoni cells that share the underline treatment; the active cell shows the 2px ink underline and filled cells show a bullet.
- **Segmented choice:** A hairline-bordered row of caps options; the checked option inverts to ink with paper text.
- **Error / Disabled:** The error message replaces the hint in ink (see the Quiet Error Rule). Disabled fields drop to 40%.

### Navigation
- **Showcase header:** 4.5rem tall, transparent with paper text over the hero; after 72% of the viewport it becomes paper at 95% with blur and a hairline under, over 500ms. Wordmark at left, caps links with drawn underlines in the centre, "Ma galerie" at right (line-inverse over the photo, ink once solid).
- **Mobile menu:** A full-screen ink sheet. Links are set in 2.6rem Bodoni and rise in with a 60ms stagger; the paper primary button is pinned at the bottom.
- **Gallery bar:** Sticky paper bar with a hairline under. Caps filter tabs show a tabular count; the active tab is ink with its underline drawn, inactive tabs are graphite.
- **Admin header:** A 4rem ink bar with the wordmark, caps section link, storage status (paper dot when online, silver ring when offline) and silver icon buttons that go to paper on hover.

### Vellum Interleaf (signature)
The system's one authored motion. On the hero, the vellum card lifts off the photograph as the page scrolls: it clips from the bottom and rises 6vh over the first 85vh, while the photograph beneath settles from 108% to 100% scale over 100vh. Both use scroll-driven timelines and switch off under reduced motion. Photographs below the fold carry no veil: a frosted layer over a photo reads as a missing image.

### Lightbox
A full-screen ink dialog with grain. A caps counter and filename sit top left; heart, download and close are 48px icon buttons top right, with 56px chevrons at the sides. Images fade and slide over 300–550ms on the expo curve. Supports swipe, pinch, double-tap and wheel zoom up to 4×.

### Wordmark and Monogram
The wordmark is "*So*Prod" in Bodoni with an italic "So". The monogram is an italic S and roman P inside two engraved rings (0.6 and 0.35 stroke) over a small rule and dot; it opens every vellum card, notice and empty state, at 40–72px.

### Icons
Hand-drawn 24px line icons with a 1.25 stroke and round caps; the heart fills solid when selected. Icons are 14–22px and belong to controls, counts and status; the monogram, not an icon, is what heads a card.

## Do's and Don'ts

### Do:
- **Do** keep the interface to ink (#0b0b0b), paper (#ffffff) and the three greys; let the photographs supply every other tone.
- **Do** put a photograph under every vellum sheet, and give it the lift.
- **Do** place the engraved double rule directly under a centred heading, followed by the event type, date or tagline.
- **Do** turn one phrase of each display heading into italic, and always italicise the ampersand and the "So".
- **Do** set every control, caption and counter in Jost caps at 0.72rem with 0.24em tracking.
- **Do** draw outlines and underlines as inset 1px box-shadows, and thicken them to 2px ink on focus.
- **Do** lay film grain over ink fields and keep paper fields clean.
- **Do** use the expo ease-out (cubic-bezier(0.16, 1, 0.3, 1)) for entrances and the quart ease-out (cubic-bezier(0.25, 1, 0.5, 1)) for button state changes, and honour reduced motion.

### Don't:
- **Don't** add a kicker or eyebrow above a heading; context goes below the double rule.
- **Don't** introduce cream, ivory, blush, gold, script or calligraphic faces; that is the wedding romance SoProd refuses.
- **Don't** use neon, glow, accent colours or gradient chrome on dark fields; that is the portfolio look SoProd refuses.
- **Don't** round a rectangle. Circles are only for objects that are round by nature (monogram rings, status dot, play ring).
- **Don't** use hard offset shadows or stacked card elevation; the only lift is vellum's long, soft shadow.
- **Don't** set Bodoni below 1.25rem, or Jost caps above a heading.
- **Don't** signal state or error with colour; invert ink and paper, or darken graphite to ink.
