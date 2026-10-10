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
  image_position: "center",
  height_percent: 100,
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

// Screens narrower than this use height_percent_mobile, if it's set.
const MOBILE_BREAKPOINT = 768;

// How quickly the fade falls off. 1 is linear; higher values fade out faster near the corner.
const FADE_EASING = 1.6;
const FADE_STEPS = 8;

// Load Roboto (all weights, including Extra Light 200) once for the whole page.
// Fonts must be loaded in the main document; @font-face inside a shadow root is ignored.
const FONT_LINK_ID = "minimal-dashboard-header-card-font";
if (!document.getElementById(FONT_LINK_ID)) {
  const link = document.createElement("link");
  link.id = FONT_LINK_ID;
  link.rel = "stylesheet";
  link.href = "https://fonts.googleapis.com/css2?family=Roboto:wght@100..900&display=swap";
  document.head.appendChild(link);
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
    border: none;
    /* Same rounding as the other cards in the theme */
    border-radius: var(--mdc-header-card-radius, var(--ha-card-border-radius, 12px));
    background-color: var(--mdc-header-card-background, #01152f);
    /* Fills the width; only scales up if the card is taller than the image */
    background-size: cover;
    background-repeat: no-repeat;
    background-position: center;
  }
  @media (max-width: ${MOBILE_BREAKPOINT - 1}px) {
    ha-card {
      aspect-ratio: var(--mdc-header-ratio-mobile, var(--mdc-header-ratio));
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
    const desktopPercent = Number(c.height_percent) > 0 ? Number(c.height_percent) : DEFAULTS.height_percent;
    const mobilePercent = Number(c.height_percent_mobile) > 0 ? Number(c.height_percent_mobile) : desktopPercent;
    this._card.style.setProperty("--mdc-header-ratio", ratio(desktopPercent));
    this._card.style.setProperty("--mdc-header-ratio-mobile", ratio(mobilePercent));
    this._card.style.backgroundImage = c.image ? `url("${c.image}")` : "none";
    this._card.style.backgroundPosition = `center ${c.image_position}`;

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
    this._title.style.fontFamily = `"${c.font_family}", var(--ha-font-family-body, sans-serif)`;
    this._title.style.fontWeight = c.font_weight;
    this._title.style.fontSize = c.font_size ? `${Number(c.font_size)}px` : TITLE_SIZE;
  }
}

// ---- Visual editor -----------------------------------------------------

const percentSlider = (min, max) => ({ number: { min, max, mode: "slider", unit_of_measurement: "%" } });

// Title and image are always visible; everything else is in collapsible sections.
const EDITOR_SCHEMA = [
  { name: "title", selector: { text: {} } },
  { name: "image", selector: { text: {} } },
  {
    name: "size_section",
    type: "expandable",
    flatten: true,
    title: "Size",
    icon: "mdi:arrow-expand-vertical",
    schema: [
      { name: "height_percent", selector: percentSlider(20, 100) },
      { name: "height_percent_mobile", selector: percentSlider(20, 100) },
      {
        name: "image_position",
        required: true,
        selector: {
          select: {
            mode: "dropdown",
            options: [
              { value: "top", label: "Top" },
              { value: "center", label: "Middle" },
              { value: "bottom", label: "Bottom" },
            ],
          },
        },
      },
    ],
  },
  {
    name: "text_section",
    type: "expandable",
    flatten: true,
    title: "Title text",
    icon: "mdi:format-text",
    schema: [
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
  height_percent: "Height on desktop",
  height_percent_mobile: "Height on phones",
  image_position: "Image alignment",
  text_color: "Colour",
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
  height_percent_mobile: `Used on screens narrower than ${MOBILE_BREAKPOINT}px.`,
  image_position: "Which part of the image to keep when the height crops it.",
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
      this._form.schema = EDITOR_SCHEMA;
      this._form.computeLabel = (schema) => schema.title || EDITOR_LABELS[schema.name] || schema.name;
      this._form.computeHelper = (schema) => EDITOR_HELPERS[schema.name];
      this._form.addEventListener("value-changed", (ev) => {
        // Only save what differs from the defaults, so the YAML stays short
        const config = { ...ev.detail.value };
        delete config.height; // pixel height from v0.2.0, replaced by height_percent
        Object.keys(config).forEach((key) => {
          const value = config[key];
          const empty = value === "" || value === undefined || value === null;
          if (empty || (key !== "title" && isDefault(key, value))) delete config[key];
        });
        // Until the phone height is changed, don't save it, so it keeps following the desktop height
        const phoneUntouched =
          this._config.height_percent_mobile === undefined && config.height_percent_mobile === this._shownMobile;
        if (phoneUntouched || config.height_percent_mobile === (config.height_percent ?? DEFAULTS.height_percent)) {
          delete config.height_percent_mobile;
        }
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
    // The phone height starts at the desktop height until it's changed.
    const data = { ...DEFAULTS, ...this._config };
    if (data.height_percent_mobile === undefined) data.height_percent_mobile = data.height_percent;
    this._shownMobile = data.height_percent_mobile;
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
