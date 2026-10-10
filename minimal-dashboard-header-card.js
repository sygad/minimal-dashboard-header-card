/**
 * Minimal Dashboard Header Card for Home Assistant
 * A background image with a diagonal colour fade and a title in the top left corner.
 */

const CARD_VERSION = "0.2.0";

console.info(
  `%c MINIMAL-DASHBOARD-HEADER-CARD %c v${CARD_VERSION} `,
  "color: white; background: #002c65; font-weight: 700;",
  "color: #002c65; background: white; font-weight: 700;"
);

const DEFAULTS = {
  title: "Lounge",
  image: "",
  image_position: "center",
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

// The card keeps the shape of the reference design (2064 x 512) unless a height is set.
// The width always comes from the dashboard layout, and the image, fade and title all
// scale with the width only, so changing the height just shows more or less of the image.
const ASPECT_RATIO = "2064 / 512";
const IMAGE_HEIGHT_CQW = (512 / 2064) * 100; // image height as a % of the card width
const TITLE_SIZE = "7.75cqw";

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
    height: 100%;
  }
  ha-card {
    display: block;
    position: relative;
    overflow: hidden;
    height: 100%;
    aspect-ratio: ${ASPECT_RATIO};
    container-type: inline-size;
    box-sizing: border-box;
    border: none;
    border-radius: var(--mdc-header-card-radius, 16px);
    background-color: var(--mdc-header-card-background, #01152f);
    /* Fills the width; only scales up if the card is taller than the image */
    background-size: cover;
    background-repeat: no-repeat;
    background-position: center;
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
    padding: var(--mdc-header-title-padding, 2cqw 2.1cqw);
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
    return this._config?.height ? Math.max(1, Math.round(Number(this._config.height) / 50)) : 3;
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

    // With a fixed height, turn off the aspect ratio so it can't change the width.
    this._card.style.height = c.height ? `${Number(c.height)}px` : "";
    this._card.style.aspectRatio = c.height ? "auto" : "";
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

const EDITOR_SCHEMA = [
  { name: "title", selector: { text: {} } },
  { name: "image", selector: { text: {} } },
  {
    type: "grid",
    name: "",
    schema: [
      { name: "height", selector: { number: { min: 40, max: 600, mode: "box", unit_of_measurement: "px" } } },
      {
        name: "image_position",
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
    type: "grid",
    name: "",
    schema: [
      { name: "text_color", selector: { color_rgb: {} } },
      { name: "font_size", selector: { number: { min: 10, max: 200, mode: "box", unit_of_measurement: "px" } } },
      {
        name: "font_weight",
        selector: {
          select: {
            mode: "dropdown",
            options: [
              { value: 100, label: "Thin (100)" },
              { value: 200, label: "Extra Light (200)" },
              { value: 300, label: "Light (300)" },
              { value: 400, label: "Regular (400)" },
              { value: 500, label: "Medium (500)" },
              { value: 700, label: "Bold (700)" },
            ],
          },
        },
      },
    ],
  },
  {
    type: "grid",
    name: "",
    schema: [
      { name: "fade_start_color", selector: { color_rgb: {} } },
      { name: "fade_start_opacity", selector: { number: { min: 0, max: 100, mode: "slider", unit_of_measurement: "%" } } },
      { name: "fade_end_color", selector: { color_rgb: {} } },
      { name: "fade_end_opacity", selector: { number: { min: 0, max: 100, mode: "slider", unit_of_measurement: "%" } } },
    ],
  },
  {
    type: "grid",
    name: "",
    schema: [
      { name: "fade_width", selector: { number: { min: 0, max: 200, mode: "slider", unit_of_measurement: "%" } } },
      { name: "fade_height", selector: { number: { min: 0, max: 300, mode: "slider", unit_of_measurement: "%" } } },
    ],
  },
];

const EDITOR_LABELS = {
  title: "Title",
  image: "Background image URL (e.g. /local/lounge.jpeg)",
  text_color: "Text colour",
  font_size: "Text size (blank = scale with card)",
  font_weight: "Text weight",
  height: "Card height (blank = match image shape)",
  image_position: "Image alignment when the height crops it",
  fade_start_color: "Fade colour (top left)",
  fade_start_opacity: "Fade opacity (top left)",
  fade_end_color: "Fade colour (end)",
  fade_end_opacity: "Fade opacity (end)",
  fade_width: "Fade width (% of card width)",
  fade_height: "Fade height (% of image height)",
};

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
      this._form.computeLabel = (schema) => EDITOR_LABELS[schema.name] || schema.name;
      this._form.addEventListener("value-changed", (ev) => {
        // Drop empty fields so the defaults are used
        const config = { ...ev.detail.value };
        Object.keys(config).forEach((key) => {
          if (config[key] === "" || config[key] === undefined || config[key] === null) delete config[key];
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
    // Show the defaults in the form so the colour pickers and sliders aren't blank
    this._form.data = { ...DEFAULTS, ...this._config };
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
