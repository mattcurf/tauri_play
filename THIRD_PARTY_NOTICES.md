# Third-Party Notices

This repository includes or depends on third-party software.

## Mixed-License Note

The repository's own original code is licensed under Apache 2.0, but some dependencies are
provided under different upstream licenses. These third-party components keep their own licenses;
they are not relicensed to Apache 2.0 by inclusion in this repository.

## Vendored Code

At the time of writing, this repository does not vendor third-party source trees into the git
checkout.

The main third-party review surfaces are:

- npm dependencies resolved by `package-lock.json`
- Rust crates resolved by `src-tauri/Cargo.lock`
- generated Tauri schema files under `src-tauri/gen/schemas`

## Direct npm Dependencies

At the time of writing, the direct runtime and development dependencies declared in
`package.json` are:

- `@tauri-apps/api` `^2.0.0` - license: `Apache-2.0 OR MIT`
- `@tauri-apps/cli` `^2.0.0` - license: `Apache-2.0 OR MIT`
- `@types/three` `0.128.0` - license: `MIT`
- `three` `0.128.0` - license: `MIT`
- `typescript` `^5.9.3` - license: `Apache-2.0`
- `vite` `^7.0.0` - license: `MIT`

These license notes were taken from package metadata in the local npm lockfile used for
development.

## Direct Cargo Dependencies

At the time of writing, the direct Rust dependencies declared in `src-tauri/Cargo.toml` are:

- `tauri` `2` - license: `Apache-2.0 OR MIT`
- `tauri-build` `2` - license: `Apache-2.0 OR MIT`

Rust crates pulled transitively by Tauri remain subject to their own upstream licenses. The exact
resolved dependency graph is recorded in `src-tauri/Cargo.lock`.

## Build-Time Managed Dependencies

This project pulls third-party packages from npm and crates.io during dependency resolution and
build steps. Because these dependencies are downloaded into the local package caches instead of
being vendored into this repository, their licensing terms should be reviewed from upstream package
metadata and source as part of release or redistribution review.
