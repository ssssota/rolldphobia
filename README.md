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

## How it works

1. **Define imports** - Add the packages you want to analyze with their import statements
2. **Bundle & Analyze** - Click the button to trigger the bundling process
3. **View results** - See bundle sizes, compression rates, and bundle time

**Note:** The first run will download the Rolldown binary (~10MB) and the imported packages. Subsequent runs will use cached versions.

## Technology Stack

- **Bundler**: [Rolldown](https://rolldown.rs) - Rust-powered JavaScript bundler running via WebAssembly
- **CDN**: [esm.sh](https://esm.sh) - Fast, smart CDN for modern web development
- **Framework**: [Preact](https://preactjs.com) with Signals for reactive state management
- **Styling**: [UnoCSS](https://unocss.dev) for utility-first CSS
- **Build Tool**: [Vite](https://vite.dev) for fast development and optimized builds

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

## Author

[@ssssota](https://github.com/ssssota)
