@echo off
echo 🚀 Preparing Jobillo for deployment...

REM Clean previous builds
echo 🧹 Cleaning previous builds...
if exist dist rmdir /s /q dist

REM Install dependencies
echo 📦 Installing dependencies...
npm ci

REM Download face detection models
echo 🤖 Downloading face detection models...
npm run setup-models

REM Build the application
echo 🔨 Building application...
npm run build

REM Verify build
if exist "dist\index.js" (
    if exist "dist\public\index.html" (
        echo ✅ Build successful!
        echo 📁 Build artifacts:
        dir dist
        echo 📁 Public assets:
        dir dist\public
        echo.
        echo 🎉 Ready for deployment to Render!
        echo 📋 Next steps:
        echo    1. Push to GitHub: git add . ^&^& git commit -m "Deploy to Render" ^&^& git push
        echo    2. Create new Web Service on Render
        echo    3. Connect your GitHub repository
        echo    4. Use the configuration from render.yaml
    ) else (
        echo ❌ Build failed! Missing public assets.
        exit /b 1
    )
) else (
    echo ❌ Build failed! Missing server bundle.
    exit /b 1
)