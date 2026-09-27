# pi-loaded-tools

[![codecov](https://codecov.io/gh/shaftoe/pi-loaded-tools/graph/badge.svg?token=oR4qN5fNMu)](https://codecov.io/gh/shaftoe/pi-loaded-tools)

[Pi coding agent](https://pi.dev) extension to list session's loaded tools.

The extension shows tools at startup and with `/tools`, separated into `[Disabled Tools]` and `[Enabled Tools]`. Press `Ctrl+O` to expand the list with source labels and scope grouping.

## Install

```bash
pi install git:github.com/marcoscale98/pi-loaded-tools
```

> [!NOTE]
> You might want to update `~/.pi/agent/settings.json` to ensure `pi-loaded-tools` is loaded last so to be able to show all available tools registered by other extensions too

## Usage

Run `/tools` inside a pi session to see the list of loaded tools.

```
/tools    # List all loaded tools with source provenance
```

## Releasing

This project uses automated publishing to NPM via GitHub Actions. The workflow will:

- Run all CI checks
- Build the package
- Publish to NPM with provenance (signed) via [trusted publishing](https://docs.npmjs.com/trusted-publishers)

## License

See [LICENSE](./LICENSE)
