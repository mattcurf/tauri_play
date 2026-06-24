# Security Policy

## Supported Versions

Until Tauri Tank Demo reaches 1.0, security fixes are provided for the latest release and the
`main` branch only. Older pre-1.0 releases may receive fixes at the maintainers' discretion.

## Reporting A Vulnerability

Please do not open a public issue that contains vulnerability details, signing material, private
keys, credentials, local machine paths, or other secrets.

Use GitHub's private vulnerability reporting / Security Advisory flow for this repository. If that
is unavailable, open a minimal public issue asking for a private reporting channel, but do not
include exploit details or secrets in that issue.

Helpful reports include:

- Affected version or commit.
- Reproduction steps and expected impact.
- Operating system and whether the issue affects the browser frontend, the Tauri desktop shell, or
  packaged artifacts.
- Whether the issue can expose local files, signing credentials, environment variables, or system
  permissions.
- Whether the issue involves CSP bypass, dependency compromise, Tauri IPC/capabilities, WebView
  behavior, installer behavior, or release artifact integrity.

## Security Scope

Examples of in-scope issues include:

- Accidental exposure of secrets, signing keys, or local paths.
- Tauri configuration that grants more desktop capability than the app needs.
- CSP bypasses that enable unintended script execution in the desktop WebView.
- Dependency vulnerabilities affecting the frontend or Tauri shell.
- Build, packaging, or release workflow issues that could compromise distributed artifacts.

The current app is a local demo with no custom Rust IPC commands, no network API calls, and no
live industrial-control integrations. If future changes add remote content, Tauri plugins,
filesystem access, shell access, auto-updates, or process-control integrations, reassess this
security policy and the Tauri capability/CSP configuration in the same change.
