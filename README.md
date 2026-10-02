# wifi-poster-generator
JS-only web-page, that generates wifi QR poster for customers with predefined set of designs

## Usage
Open `index.html` in a browser (works offline, no build, no server). Fill in SSID/password, pick a design, press **Печать / PDF**.
In the print dialog: margins "None", scale 100%, enable "Background graphics".

- Designs: Чистый, Тёмный, Яркий, Рамка; custom accent color
- A4 / A5
- LV / EN / RU, any subset, reorderable (first one is the large one)
- Client logo (per poster) + own logo and footer text (remembered in localStorage)
- Wi-Fi credentials never leave the browser and are not stored

QR library: [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) (MIT), vendored in `vendor/`.
