# Rolld(own)phobia

A modern bundle size analyzer powered by [Rolldown](https://rolldown.rs) and [esm.sh](https://esm.sh) — running entirely in your browser.

Inspired by [Bundlephobia](https://bundlephobia.com) and [Shakerphobia](https://shakerphobia.netlify.app/).

## Features

- 🚀 **Browser-based bundling** - No server required, all processing happens in your browser
- 📦 **Real bundle analysis** - Uses Rolldown to generate actual production bundles
- ⚡ **Fast** - Leverages esm.sh CDN for instant package resolution
- 🎯 **Accurate metrics** - Shows bundle size, gzipped size, and bundle time
- 🌐 **Multiple package support** - Analyze multiple imports at once
- 🔍 **Code inspection** - View the generated minified bundle code

## Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview

# Format and lint
pnpm fmt
pnpm lint
```

## License

MIT
