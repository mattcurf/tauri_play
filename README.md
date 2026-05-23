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

Tauri builds host-native unsigned artifacts: `.app`/`.dmg` on macOS, `.msi`/`.exe` on Windows, and `.deb`/`.AppImage`/`.rpm` on Linux. Cross-compilation is not used.

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
