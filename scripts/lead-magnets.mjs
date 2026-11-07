/**
 * Lead magnets for the sticky sidebar card on letter pages.
 *
 * A letter picks one with `leadMagnet: <slug>` in its front matter, or
 * `leadMagnet: none` to hide the card. Letters without the field get DEFAULT.
 *
 *   label        small uppercase line above the cover ("Free template")
 *   title        serif title under the cover
 *   description  one line of gray copy
 *   image        cover image path. Spec: 800 x 600 px (4:3), PNG or JPG,
 *                artwork centred with breathing room. It sits in a light
 *                rounded panel, shown at about 300 x 225 on desktop.
 *   href         the lead magnet's landing page
 *   link         link text (defaults to "Download free")
 */

export const LEAD_MAGNETS = {
  "prd-template": {
    label: "Free template",
    title: "The PRD Template",
    description: "Blank, filled in, and the order to fill it in. A PRD engineering will actually read.",
    image: "/assets/images/lead-magnets/prd-template-cover.webp",
    href: "/free-prd-template/",
  },
  "case-study": {
    label: "Free Claude Skill",
    title: "The 15 Minute Case Study",
    description: "Turn rough project notes into a case study that proves what changed.",
    image: "/assets/images/lead-magnets/15-minute-case-study-cover.svg",
    href: "/roi-case-study-template/",
  },
};

export const DEFAULT_LEAD_MAGNET = "case-study";
