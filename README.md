# Minimal Dashboard Header Card

A simple Home Assistant header card: a background image with a diagonal colour fade from the top left corner, and a title in the top left.

![Minimal Dashboard Header Card](Images/Header%20Card%20Reference.png)

- Pick your own background image
- The fade colours, opacity and length can all be changed
- The title text, colour, size and weight can all be changed
- Separate heights for desktop and phones
- Simple visual editor, so you don't need to write YAML

## Installation (HACS)

1. In Home Assistant, open **HACS**.
2. Click the **⋮** menu (top right), then **Custom repositories**.
3. Paste `https://github.com/sygad/minimal-dashboard-header-card`, set **Type** to **Dashboard**, and click **Add**.
4. Search for **Minimal Dashboard Header Card**, open it, and click **Download**.
5. Refresh your browser.

## Adding your background image

Copy your image into the `www` folder in your Home Assistant config folder (create the folder if it isn't there yet). For example, `/config/www/lounge.jpeg` is then available at `/local/lounge.jpeg`.

A wide image works best, around 4:1 (for example 2064 × 512).

Want to try it out first? Download the [example lounge image](https://github.com/sygad/minimal-dashboard-header-card/raw/main/Images/Background%20image.jpeg), rename it to `lounge.jpeg` and copy it to `/config/www/`.

> If you've just created the `www` folder, restart Home Assistant once so it starts serving `/local/`.

## Usage

Edit a dashboard, click **Add card**, and search for **Minimal Dashboard Header Card**.

Or with YAML:

```yaml
type: custom:minimal-dashboard-header-card
title: Lounge
image: /local/lounge.jpeg
height_percent: 70                # optional
height_percent_mobile: 100        # optional
image_offset: 80                  # optional: 0 = top of the image, 100 = bottom
text_color: [255, 255, 255]       # optional
fade_start_color: [0, 0, 0]       # optional
fade_end_color: [255, 255, 255]   # optional
```

## Options

| Option               | Default           | Description                                                      |
| -------------------- | ----------------- | ---------------------------------------------------------------- |
| `title`              | `Lounge`          | The text in the top left corner                                  |
| `image`              | none              | URL of the background image                                      |
| `text_color`         | `[255, 255, 255]` | Title colour, as `[r, g, b]` or any CSS colour (e.g. `"#fff"`)   |
| `font_size`          | scales with card  | Title size in px. Leave blank to scale with the card width (recommended) |
| `font_weight`        | `200`             | Title weight, from `100` (thin) to `900` (black). `200` is Extra light |
| `font_family`        | `Roboto`          | Title font: `theme`, or the name of any font from [Google Fonts](https://fonts.google.com) |
| `font_url`           | none              | A font file you host yourself, e.g. `/local/fonts/myfont.woff2`. Used instead of `font_family` |
| `height_percent`     | `100`             | Card height as a % of the image height. `100` shows the whole image; lower values crop it. The card keeps this shape on every screen, so a phone shows a scaled-down copy of the desktop card |
| `height_percent_mobile` | same as `height_percent` | Card height on screens narrower than 768px, as a % of the image height. Use this if the desktop height looks too short on a phone |
| `image_offset`       | `50`              | Which part of the image to show when the height crops it, from `0` (top) to `100` (bottom). The older `image_position: top / center / bottom` still works |
| `fade_start_color`   | `[0, 0, 0]`       | Fade colour in the top left corner                               |
| `fade_start_opacity` | `70`              | Fade opacity in the top left corner (0–100)                      |
| `fade_end_color`     | `[255, 255, 255]` | Fade colour where the fade ends                                  |
| `fade_end_opacity`   | `0`               | Fade opacity where the fade ends (0–100)                         |
| `fade_width`         | `52`              | How far the fade reaches to the right, as % of the card width    |
| `fade_height`        | `132`             | How far the fade reaches down, as % of the image height          |

With the default fade size, the fade ends at the middle of the card along the diagonal.

## Layout tips

For the header to line up with the sections below it, put it in its own section with **no background** (edit the section, then turn off **Background**). Sections with a background add padding, which makes the card narrower than the sections below and adds extra space underneath it.

## Theme variables (optional)

| Variable                      | Default     |
| ----------------------------- | ----------- |
| `mdc-header-card-background`  | `#01152f`   |
| `mdc-header-card-radius`      | your theme's card radius (`12px` if not set) |
| `mdc-header-title-margin`     | `0`         |
| `mdc-header-title-padding`    | `max(2cqw, 12px) max(2.1cqw, 16px)` (scales with the card, never smaller than 12px / 16px) |

## Fonts

Pick a font in the editor under **Title text → Font**:

- **Theme font** uses your Home Assistant theme's font. Nothing is downloaded.
- **Roboto, Inter, Montserrat** and the other listed fonts come from Google Fonts. They all have light weights, which suit a header.
- **Other Google font…** lets you type the name of any font on [fonts.google.com](https://fonts.google.com).
- **Custom font file…** uses a font file you put in your `/config/www` folder (`.woff2` or `.ttf`), e.g. `/local/fonts/myfont.woff2`.

Google fonts are downloaded by each device that shows the dashboard, so they need an internet connection, and the device contacts Google. If you'd rather avoid that, use **Theme font** or **Custom font file**. If a font can't be loaded, the card falls back to your theme's font.
