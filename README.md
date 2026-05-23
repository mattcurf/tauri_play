# Tauri Tank Demo

A Tauri 2 desktop app hosting a Vite + TypeScript + Three.js r128 SCADA storage tank simulation. Rust is used as the Tauri shell only; the simulation, HMI controls, and WebGL scene all run in the frontend.

## Run the app

From this repository directory:

```bash
npm install
npm run tauri dev
```

`npm run tauri dev` starts the Vite dev server and opens the tank demo in a native Tauri desktop window.

If you only want to run the frontend in a browser, use:

```bash
npm install
npm run dev
```

Then open <http://127.0.0.1:1420/>.

## Prerequisites

<details><summary>Windows</summary>

- Visual Studio 2022 Build Tools with the Desktop development with C++ workload
- WebView2 Runtime (preinstalled on Windows 11; install separately for some Windows 10 systems)
- Rust via rustup: <https://rustup.rs>
- Node.js 20+: <https://nodejs.org>

</details>

<details><summary>macOS</summary>

- Xcode Command Line Tools: `xcode-select --install`
- Rust via rustup: `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
- Node.js 20+: `brew install node`

</details>

<details><summary>Linux — Debian / Ubuntu</summary>

```bash
sudo apt update
sudo apt install -y \
  libwebkit2gtk-4.1-dev \
  build-essential \
  curl wget file \
  libxdo-dev \
  libssl-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev
```

Then install Rust via rustup and Node.js 20+.

</details>

<details><summary>Linux — Fedora</summary>

```bash
sudo dnf install -y \
  webkit2gtk4.1-devel \
  openssl-devel \
  curl wget file \
  libappindicator-gtk3-devel \
  librsvg2-devel
sudo dnf group install "c-development"
```

</details>

<details><summary>Linux — Arch</summary>

```bash
sudo pacman -S --needed \
  webkit2gtk-4.1 \
  base-devel \
  curl wget file \
  openssl \
  libappindicator-gtk3 \
  librsvg
```

</details>

## Build per platform

```bash
npm run tauri build
```

Tauri builds host-native artifacts: `.app`/`.dmg` on macOS, `.msi`/`.exe` on Windows, and `.deb`/`.AppImage`/`.rpm` on Linux. Cross-compilation is not used.

On macOS the app bundle is ad-hoc signed so locally built `.app` bundles can launch without the “damaged” invalid-signature error. It is not notarized; for distribution outside your machine, sign with a Developer ID certificate and notarize the build.

### macOS Gatekeeper troubleshooting

If you trust a locally built or CI-downloaded app and macOS still reports that it is damaged or cannot be opened, clear the quarantine attribute for just that app:

```bash
APP="/Applications/Tauri Tank Demo.app"
xattr -dr com.apple.quarantine "$APP"
open "$APP"
```

For an app downloaded from a GitHub Actions artifact, also repair executable permissions and refresh the ad-hoc signature if needed:

```bash
APP="$HOME/Downloads/Tauri Tank Demo.app"
chmod +x "$APP/Contents/MacOS/tauri-tank-demo"
codesign --force --deep --sign - "$APP"
xattr -dr com.apple.quarantine "$APP"
open "$APP"
```

Avoid `sudo spctl --master-disable`; it disables Gatekeeper globally. Prefer clearing quarantine only on an app you trust.

## Local checks

```bash
npm run build
(cd src-tauri && cargo check)
```

## Architecture

- Tauri 2 shell with no custom Rust IPC commands
- Vite + TypeScript frontend
- Three.js r128 tank scene with the TK-101 shell, liquid level, inlet/outlet valves, HMI tags, alarm rings, and orbit controls
- `requestAnimationFrame` simulation loop updates HMI telemetry and scene state
