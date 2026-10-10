/**
 * Minimal Dashboard Header Card for Home Assistant
 * A background image with a diagonal colour fade and a title in the top left corner.
 */

const CARD_VERSION = "0.4.0";

console.info(
  `%c MINIMAL-DASHBOARD-HEADER-CARD %c v${CARD_VERSION} `,
  "color: white; background: #002c65; font-weight: 700;",
  "color: #002c65; background: white; font-weight: 700;"
);

const DEFAULTS = {
  title: "Lounge",
  image: "",
  height_percent: 100,
  image_offset: 50,
  height_percent_mobile: 100,
  image_offset_mobile: 50,
  fade_start_color: [0, 0, 0],
  fade_start_opacity: 70,
  fade_end_color: [255, 255, 255],
  fade_end_opacity: 0,
  fade_width: 52,
  fade_height: 132,
  text_color: [255, 255, 255],
  font_family: "Roboto",
  font_weight: 200,
};

// The width always comes from the dashboard layout. The height is a % of the image height
// (2064 x 512), so the card keeps the same shape on every screen, and the image, fade and
// title all scale with the width: a phone shows a scaled down copy of the desktop card.
const IMAGE_WIDTH = 2064;
const IMAGE_HEIGHT = 512;
const IMAGE_HEIGHT_CQW = (512 / 2064) * 100; // image height as a % of the card width
const TITLE_SIZE = "7.75cqw";

// Screens narrower than this use the phone settings (height_percent_mobile, image_offset_mobile).
// Desktop and phone settings are independent.
const MOBILE_BREAKPOINT = 768;

// image_offset is 0 (top of the image) to 100 (bottom). image_position is from v0.2.0.
const LEGACY_POSITIONS = { top: 0, center: 50, bottom: 100 };
const imageOffset = (config) => config.image_offset ?? LEGACY_POSITIONS[config.image_position] ?? DEFAULTS.image_offset;

// How quickly the fade falls off. 1 is linear; higher values fade out faster near the corner.
const FADE_EASING = 1.6;
const FADE_STEPS = 8;

// ---- Fonts -------------------------------------------------------------
// font_family is "theme", one of the fonts below, or any Google Fonts name.
// font_url points at a self-hosted font file and takes priority over font_family.
// Only the font in use is downloaded. Fonts must be loaded in the main document,
// because @font-face inside a shadow root is ignored.

const THEME_FONT = "var(--ha-font-family-body, var(--primary-font-family, Roboto, sans-serif))";

// Popular Google Fonts with light weights, and the weights each one has
const FONT_LIST = {
  Roboto: "100..900",
  Inter: "100..900",
  Montserrat: "100..900",
  Raleway: "100..900",
  Poppins: "100;200;300;400;500;600;700;800;900",
  Lato: "100;300;400;700;900",
  Nunito: "200..1000",
  "Open Sans": "300..800",
  Oswald: "200..700",
  "Playfair Display": "400..900",
};

const googleFontUrl = (family, weights) =>
  `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replace(/%20/g, "+")}` +
  (weights ? `:wght@${weights}` : "") +
  "&display=swap";

function loadGoogleFont(family) {
  const id = `mdhc-font-${family.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = googleFontUrl(family, FONT_LIST[family] || "100..900");
  // A font that isn't in FONT_LIST may not have every weight, which Google rejects,
  // so fall back to asking for the font with its default weight
  link.onerror = () => {
    link.onerror = null;
    link.href = googleFontUrl(family);
  };
  document.head.appendChild(link);
}

function loadFontFile(url) {
  const family = `mdhc-custom-${Array.from(url).reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7)}`;
  if (!document.getElementById(family)) {
    const style = document.createElement("style");
    style.id = family;
    style.textContent = `@font-face { font-family: "${family}"; src: url("${url}"); font-weight: 100 900; font-display: swap; }`;
    document.head.appendChild(style);
  }
  return family;
}

// Returns the CSS font-family for a config, loading the font if needed
function titleFont(config) {
  if (config.font_url) return `"${loadFontFile(config.font_url)}", ${THEME_FONT}`;
  const family = String(config.font_family || DEFAULTS.font_family).trim();
  if (family === "theme") return THEME_FONT;
  loadGoogleFont(family);
  return `"${family}", ${THEME_FONT}`;
}

const clampOpacity = (percent) => Math.max(0, Math.min(100, Number(percent))) / 100;

// Accepts [r, g, b] from the colour picker, or any CSS colour string from YAML.
function toCssColor(value, opacityPercent) {
  const alpha = clampOpacity(opacityPercent);
  if (Array.isArray(value)) {
    const [r, g, b] = value;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return `color-mix(in srgb, ${value} ${alpha * 100}%, transparent)`;
}

// Builds eased colour stops between two [r, g, b] colours. Colours are mixed with
// premultiplied alpha, like CSS does, so fading to a transparent colour doesn't tint the fade.
function fadeStops(start, startOpacity, end, endOpacity) {
  if (!Array.isArray(start) || !Array.isArray(end)) {
    return `${toCssColor(start, startOpacity)} 0%, ${toCssColor(end, endOpacity)} 100%`;
  }
  const a0 = clampOpacity(startOpacity);
  const a1 = clampOpacity(endOpacity);
  const stops = [];
  for (let i = 0; i <= FADE_STEPS; i++) {
    const t = i / FADE_STEPS;
    const k = 1 - Math.pow(1 - t, FADE_EASING);
    const alpha = a0 + (a1 - a0) * k;
    const rgb = [0, 1, 2].map((c) => {
      const premultiplied = start[c] * a0 + (end[c] * a1 - start[c] * a0) * k;
      return Math.round(alpha > 0 ? premultiplied / alpha : end[c]);
    });
    stops.push(`rgba(${rgb.join(", ")}, ${alpha.toFixed(3)}) ${(t * 100).toFixed(1)}%`);
  }
  return stops.join(", ");
}

const STYLES = `
  :host {
    display: block;
  }
  ha-card {
    display: block;
    position: relative;
    overflow: hidden;
    container-type: inline-size;
    box-sizing: border-box;
    aspect-ratio: var(--mdc-header-ratio);
    background-position: center var(--mdc-header-offset);
    border: none;
    /* Same rounding as the other cards in the theme */
    border-radius: var(--mdc-header-card-radius, var(--ha-card-border-radius, 12px));
    background-color: var(--mdc-header-card-background, #01152f);
    /* Fills the width; only scales up if the card is taller than the image */
    background-size: cover;
    background-repeat: no-repeat;
  }
  @media (max-width: ${MOBILE_BREAKPOINT - 1}px) {
    ha-card {
      aspect-ratio: var(--mdc-header-ratio-mobile);
      background-position: center var(--mdc-header-offset-mobile);
    }
  }
  .fade {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }
  .title {
    position: absolute;
    top: 0;
    left: 0;
    margin: var(--mdc-header-title-margin, 0);
    /* Scales with the card, but never gets closer than 16px to the corner on small screens.
       The top is smaller because the line box already has some space above the capitals. */
    padding: var(--mdc-header-title-padding, max(2cqw, 12px) max(2.1cqw, 16px));
    line-height: 1;
    white-space: nowrap;
  }
`;

class MinimalDashboardHeaderCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  // ---- Lovelace API ----------------------------------------------------

  static getConfigElement() {
    return document.createElement("minimal-dashboard-header-card-editor");
  }

  static getStubConfig() {
    return { title: DEFAULTS.title, image: "/local/lounge.jpeg" };
  }

  setConfig(config) {
    this._userConfig = config;
    this._config = { ...DEFAULTS, ...config };
    this._render();
  }

  set hass(hass) {
    // Nothing on this card depends on state, so there is no need to re-render.
    this._hass = hass;
  }

  getCardSize() {
    return 3;
  }

  getGridOptions() {
    return { columns: "full", rows: "auto", min_columns: 6 };
  }

  // ---- Rendering -------------------------------------------------------

  _render() {
    if (!this._config) return;

    if (!this._card) {
      this.shadowRoot.innerHTML = `
        <style>${STYLES}</style>
        <ha-card>
          <div class="fade"></div>
          <div class="title"></div>
        </ha-card>
      `;
      this._card = this.shadowRoot.querySelector("ha-card");
      this._fade = this.shadowRoot.querySelector(".fade");
      this._title = this.shadowRoot.querySelector(".title");
    }

    const c = this._config;

    const ratio = (percent) => `${IMAGE_WIDTH} / ${(IMAGE_HEIGHT * percent) / 100}`;
    const percent = (value, fallback) => (Number(value) > 0 ? Number(value) : fallback);
    const style = this._card.style;
    style.setProperty("--mdc-header-ratio", ratio(percent(c.height_percent, DEFAULTS.height_percent)));
    style.setProperty("--mdc-header-ratio-mobile", ratio(percent(c.height_percent_mobile, DEFAULTS.height_percent_mobile)));
    style.setProperty("--mdc-header-offset", `${Number(imageOffset(this._userConfig))}%`);
    style.setProperty("--mdc-header-offset-mobile", `${Number(c.image_offset_mobile)}%`);
    this._card.style.backgroundImage = c.image ? `url("${c.image}")` : "none";

    // An ellipse centred on the top left corner. With the default size its edge passes
    // through the middle of the image, so the fade ends half way along the diagonal.
    // Both radii are based on the card width, so the fade doesn't change with the height.
    const stops = fadeStops(c.fade_start_color, c.fade_start_opacity, c.fade_end_color, c.fade_end_opacity);
    const fadeHeight = (Number(c.fade_height) / 100) * IMAGE_HEIGHT_CQW;
    this._fade.style.background = `radial-gradient(ellipse ${Number(c.fade_width)}cqw ${fadeHeight.toFixed(
      2
    )}cqw at 0 0, ${stops})`;

    this._title.textContent = c.title || "";
    this._title.style.color = toCssColor(c.text_color, 100);
    this._title.style.fontFamily = titleFont(c);
    this._title.style.fontWeight = c.font_weight;
    this._title.style.fontSize = c.font_size ? `${Number(c.font_size)}px` : TITLE_SIZE;
  }
}

// ---- Visual editor -----------------------------------------------------

const percentSlider = (min, max) => ({ number: { min, max, mode: "slider", unit_of_measurement: "%" } });

// The editor's Font dropdown. "other" and "custom" show an extra field.
const FONT_CHOICES = [
  { value: "theme", label: "Theme font" },
  ...Object.keys(FONT_LIST).map((family) => ({ value: family, label: family })),
  { value: "other", label: "Other Google font…" },
  { value: "custom", label: "Custom font file…" },
];

function fontChoiceOf(config) {
  if (config.font_url) return "custom";
  const family = config.font_family ?? DEFAULTS.font_family;
  return family === "theme" || family in FONT_LIST ? family : "other";
}

const fontFields = (fontChoice) => [
  { name: "font_choice", required: true, selector: { select: { mode: "dropdown", options: FONT_CHOICES } } },
  ...(fontChoice === "other" ? [{ name: "font_other", selector: { text: {} } }] : []),
  ...(fontChoice === "custom" ? [{ name: "font_url", selector: { text: {} } }] : []),
];

// Title and image are always visible; everything else is in collapsible sections.
const editorSchema = (fontChoice) => [
  { name: "title", selector: { text: {} } },
  { name: "image", selector: { text: {} } },
  {
    name: "desktop_section",
    type: "expandable",
    flatten: true,
    title: "Desktop size & position",
    icon: "mdi:monitor",
    schema: [
      { name: "height_percent", selector: percentSlider(20, 100) },
      { name: "image_offset", selector: percentSlider(0, 100) },
    ],
  },
  {
    name: "phone_section",
    type: "expandable",
    flatten: true,
    title: "Phone size & position",
    icon: "mdi:cellphone",
    schema: [
      { name: "height_percent_mobile", selector: percentSlider(20, 100) },
      { name: "image_offset_mobile", selector: percentSlider(0, 100) },
    ],
  },
  {
    name: "text_section",
    type: "expandable",
    flatten: true,
    title: "Title text",
    icon: "mdi:format-text",
    schema: [
      ...fontFields(fontChoice),
      { name: "text_color", selector: { color_rgb: {} } },
      {
        name: "font_weight",
        required: true,
        selector: {
          select: {
            mode: "dropdown",
            options: [
              { value: 100, label: "Thin" },
              { value: 200, label: "Extra light" },
              { value: 300, label: "Light" },
              { value: 400, label: "Regular" },
              { value: 500, label: "Medium" },
              { value: 700, label: "Bold" },
            ],
          },
        },
      },
      { name: "font_size", selector: { number: { min: 10, max: 200, mode: "box", unit_of_measurement: "px" } } },
    ],
  },
  {
    name: "fade_section",
    type: "expandable",
    flatten: true,
    title: "Fade",
    icon: "mdi:gradient-horizontal",
    schema: [
      { name: "fade_start_color", selector: { color_rgb: {} } },
      { name: "fade_start_opacity", selector: percentSlider(0, 100) },
      { name: "fade_width", selector: percentSlider(0, 200) },
      { name: "fade_height", selector: percentSlider(0, 300) },
      {
        name: "fade_more_section",
        type: "expandable",
        flatten: true,
        title: "More fade options",
        icon: "mdi:tune-variant",
        schema: [
          { name: "fade_end_color", selector: { color_rgb: {} } },
          { name: "fade_end_opacity", selector: percentSlider(0, 100) },
        ],
      },
    ],
  },
];

const EDITOR_LABELS = {
  title: "Title",
  image: "Background image",
  height_percent: "Height",
  height_percent_mobile: "Height",
  image_offset: "Image position",
  image_offset_mobile: "Image position",
  text_color: "Colour",
  font_choice: "Font",
  font_other: "Google font name",
  font_url: "Font file",
  font_weight: "Weight",
  font_size: "Size",
  fade_start_color: "Colour",
  fade_start_opacity: "Strength",
  fade_width: "Reach across",
  fade_height: "Reach down",
  fade_end_color: "End colour",
  fade_end_opacity: "End strength",
};

const EDITOR_HELPERS = {
  image: "Put the image in your /config/www folder, then enter /local/ and the file name, e.g. /local/lounge.jpeg",
  height_percent: "100% shows the whole image. Lower values crop it.",
  height_percent_mobile: `Used on screens narrower than ${MOBILE_BREAKPOINT}px. 100% shows the whole image.`,
  image_offset: "Which part of the image to show when the height crops it: 0% is the top, 50% the middle, 100% the bottom.",
  image_offset_mobile: "0% is the top of the image, 50% the middle, 100% the bottom.",
  font_choice: "Fonts other than Theme font are downloaded when the dashboard loads.",
  font_other: "Any font from fonts.google.com, e.g. Lobster",
  font_url: "Put a .woff2 or .ttf file in your /config/www folder, then enter /local/ and the file name, e.g. /local/fonts/myfont.woff2",
  font_weight: "Not every font has every weight; the closest one is used.",
  font_size: "Leave blank to scale the title with the card (recommended).",
  fade_start_opacity: "How dark the fade is in the top left corner.",
  fade_width: "How far the fade reaches, as a % of the card width.",
  fade_height: "How far the fade reaches, as a % of the image height.",
  fade_end_color: "The colour the fade blends into. Only visible if End strength is above 0%.",
};

// Values the editor fills in for display but doesn't need to save.
const isDefault = (key, value) => key in DEFAULTS && JSON.stringify(DEFAULTS[key]) === JSON.stringify(value);

class MinimalDashboardHeaderCardEditor extends HTMLElement {
  setConfig(config) {
    this._config = config;
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  _render() {
    if (!this._hass || !this._config) return;

    if (!this._form) {
      this._form = document.createElement("ha-form");
      this._form.computeLabel = (schema) => schema.title || EDITOR_LABELS[schema.name] || schema.name;
      this._form.computeHelper = (schema) => EDITOR_HELPERS[schema.name];
      this._form.addEventListener("value-changed", (ev) => {
        // Only save what differs from the defaults, so the YAML stays short
        const config = { ...ev.detail.value };
        // The font dropdown isn't saved: it decides font_family and font_url
        this._fontChoice = config.font_choice;
        if (config.font_choice === "custom") {
          delete config.font_family;
        } else {
          config.font_family = config.font_choice === "other" ? config.font_other : config.font_choice;
          delete config.font_url;
        }
        delete config.font_choice;
        delete config.font_other;
        delete config.height; // pixel height from v0.2.0, replaced by height_percent
        delete config.image_position; // replaced by image_offset
        Object.keys(config).forEach((key) => {
          const value = config[key];
          const empty = value === "" || value === undefined || value === null;
          if (empty || (key !== "title" && isDefault(key, value))) delete config[key];
        });
        this.dispatchEvent(
          new CustomEvent("config-changed", {
            detail: { config },
            bubbles: true,
            composed: true,
          })
        );
      });
      this.appendChild(this._form);
    }

    this._form.hass = this._hass;
    // Show the defaults in the form so the colour pickers and sliders aren't blank.
    const data = { ...DEFAULTS, ...this._config, image_offset: imageOffset(this._config) };
    // Remember "Other" or "Custom" while its field is still empty, so the dropdown doesn't jump back
    const pending =
      (this._fontChoice === "other" && !this._config.font_family) ||
      (this._fontChoice === "custom" && !this._config.font_url);
    const fontChoice = pending ? this._fontChoice : fontChoiceOf(this._config);
    data.font_choice = fontChoice;
    data.font_other = fontChoice === "other" ? this._config.font_family ?? "" : "";
    if (this._schemaFont !== fontChoice) {
      this._schemaFont = fontChoice;
      this._form.schema = editorSchema(fontChoice);
    }
    this._form.data = data;
  }
}

// ---- Registration ------------------------------------------------------

if (!customElements.get("minimal-dashboard-header-card")) {
  customElements.define("minimal-dashboard-header-card", MinimalDashboardHeaderCard);
}
if (!customElements.get("minimal-dashboard-header-card-editor")) {
  customElements.define("minimal-dashboard-header-card-editor", MinimalDashboardHeaderCardEditor);
}

window.customCards = window.customCards || [];
window.customCards.push({
  type: "minimal-dashboard-header-card",
  name: "Minimal Dashboard Header Card",
  description: "A background image with a diagonal colour fade and a title.",
  preview: true,
});
