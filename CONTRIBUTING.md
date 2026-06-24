# Contributing

Thanks for taking a look.

This is a small Tauri, TypeScript, and Three.js desktop demo. Contributions are welcome, but the
goal is to keep the project easy to understand and easy to run.

## Ground Rules

- Keep changes small and focused.
- Prefer straightforward TypeScript and Tauri configuration over broad framework changes.
- Do not commit real signing certificates, private keys, platform-store credentials, API tokens,
  `.env` files, local machine paths, or generated desktop bundles.
- Update `README.md` when setup, behavior, supported platforms, security posture, or release
  commands change.
- If you add or update dependencies, keep `package-lock.json` and `src-tauri/Cargo.lock` in sync
  and check the upstream license terms.
- If you reuse or adapt third-party code, assets, icons, or documentation, include the required
  attribution and license notes.

## Setup

```bash
git clone https://github.com/mattcurf/tauri-play.git
cd tauri-play
npm install
```

Install Rust and the platform-specific Tauri prerequisites listed in `README.md`.

## Development

Run the desktop app:

```bash
npm run tauri dev
```

Run only the browser frontend:

```bash
npm run dev
```

## Local Checks

Run these before opening a pull request when possible:

```bash
npm run build
cd src-tauri
cargo fmt --check
cargo check --locked
```

If you changed packaging or Tauri configuration, also run the host-native bundle build:

```bash
npm run tauri build
```

## Code Style

- Keep simulation logic under `src/sim`.
- Keep HMI DOM/control code under `src/hmi`.
- Keep Three.js scene pieces under `src/pump`.
- Avoid adding dependencies unless they materially simplify the app.
- Keep the Rust side minimal unless the app gains real desktop integration needs.
- Keep generated artifacts under `dist/`, `src-tauri/target/`, or the system temp directory.

## Pull Request Expectations

1. Explain the user-facing change and why it is needed.
2. List the checks you ran.
3. Mention any new dependencies, platform permissions, Tauri plugins, network calls, or release
   artifact changes.
4. Note any security, signing, notarization, or third-party attribution implications.

## License

By contributing to this repository, you agree that your contributions are submitted under the same
[Apache License 2.0](LICENSE) unless you explicitly state otherwise in writing.
