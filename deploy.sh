#!/bin/bash

# Jobillo Deployment Script for Render

echo "🚀 Preparing Jobillo for deployment..."

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Download face detection models
echo "🤖 Downloading face detection models..."
npm run setup-models

# Build the application
echo "🔨 Building application..."
npm run build

# Verify build
if [ -f "dist/index.js" ] && [ -f "dist/public/index.html" ]; then
    echo "✅ Build successful!"
    echo "📁 Build artifacts:"
    ls -la dist/
    echo "📁 Public assets:"
    ls -la dist/public/
    echo ""
    echo "🎉 Ready for deployment to Render!"
    echo "📋 Next steps:"
    echo "   1. Push to GitHub: git add . && git commit -m 'Deploy to Render' && git push"
    echo "   2. Create new Web Service on Render"
    echo "   3. Connect your GitHub repository"
    echo "   4. Use the configuration from render.yaml"
else
    echo "❌ Build failed! Check the logs above."
    exit 1
fi