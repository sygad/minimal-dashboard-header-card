# Minimal Dashboard Header Card

A simple Home Assistant header card: a background image with a diagonal colour fade from the top left corner, and a title in the top left.

![Minimal Dashboard Header Card](Images/Header%20Card%20Reference.png)

- Pick your own background image
- The fade colours, opacity and length can all be changed
- The title text, colour, size and weight can all be changed
- Visual editor, so you don't need to write YAML

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
height: 120                       # optional
image_position: bottom            # optional: top, center or bottom
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
| `font_size`          | scales with card  | Title size in px. Leave blank to scale with the card width       |
| `font_weight`        | `200`             | Title weight (`200` is Roboto Extra Light)                       |
| `font_family`        | `Roboto`          | Title font                                                       |
| `height`             | image shape       | Card height in px. Leave blank to keep the 2064 × 512 shape. The width always comes from your dashboard layout |
| `image_position`     | `center`          | Which part of the image to show when the height crops it: `top`, `center` or `bottom` |
| `fade_start_color`   | `[0, 0, 0]`       | Fade colour in the top left corner                               |
| `fade_start_opacity` | `70`              | Fade opacity in the top left corner (0–100)                      |
| `fade_end_color`     | `[255, 255, 255]` | Fade colour where the fade ends                                  |
| `fade_end_opacity`   | `0`               | Fade opacity where the fade ends (0–100)                         |
| `fade_width`         | `52`              | How far the fade reaches to the right, as % of the card width    |
| `fade_height`        | `132`             | How far the fade reaches down, as % of the image height          |

With the default fade size, the fade ends at the middle of the card along the diagonal.

## Theme variables (optional)

| Variable                      | Default     |
| ----------------------------- | ----------- |
| `mdc-header-card-background`  | `#01152f`   |
| `mdc-header-card-radius`      | `16px`      |
| `mdc-header-title-margin`     | `0`         |
| `mdc-header-title-padding`    | `2cqw 2.1cqw` (scales with the card) |

The card loads Roboto from Google Fonts so that every weight, including Extra Light, is available.
