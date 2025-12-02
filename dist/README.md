# Build Output Directory

This directory contains the production build output.

## Structure

```
dist/
├── index.js          # Server bundle (created by esbuild)
└── public/           # Client assets (created by Vite)
    ├── index.html
    ├── assets/
    │   ├── index-[hash].js
    │   └── index-[hash].css
    └── models/       # Face detection models
```

## Build Process

The build is created by running:
```bash
npm run build
```

This executes:
1. `npm run build:client` - Vite builds the React app to `dist/public/`
2. `npm run build:server` - esbuild bundles the server to `dist/index.js`
3. `npm run verify` - Verifies all required files exist

## Production Server

The production server runs from this directory:
```bash
npm start  # Runs: node dist/index.js
```

The server at `dist/index.js` serves static files from `dist/public/`.

## Note

The actual build files are gitignored. Only the directory structure is tracked in Git to ensure the folders exist during deployment.
