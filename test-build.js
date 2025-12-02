#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Testing build configuration...\n');

// Check if required directories exist
const requiredDirs = [
  'client/src',
  'server',
  'shared'
];

console.log('📁 Checking directories:');
requiredDirs.forEach(dir => {
  const fullPath = path.join(__dirname, dir);
  const exists = fs.existsSync(fullPath);
  console.log(`  ${exists ? '✅' : '❌'} ${dir}`);
});

// Check if required files exist
const requiredFiles = [
  'package.json',
  'vite.config.ts',
  'server/index.ts',
  'client/src/main.tsx',
  'shared/schema.ts'
];

console.log('\n📄 Checking files:');
requiredFiles.forEach(file => {
  const fullPath = path.join(__dirname, file);
  const exists = fs.existsSync(fullPath);
  console.log(`  ${exists ? '✅' : '❌'} ${file}`);
});

// Check package.json scripts
console.log('\n📦 Checking package.json scripts:');
try {
  const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
  const requiredScripts = ['build', 'start', 'setup-models'];
  
  requiredScripts.forEach(script => {
    const exists = pkg.scripts && pkg.scripts[script];
    console.log(`  ${exists ? '✅' : '❌'} ${script}: ${exists || 'missing'}`);
  });
} catch (error) {
  console.log('  ❌ Failed to read package.json');
}

// Check if models directory will be created
console.log('\n🤖 Checking models setup:');
const modelsDir = path.join(__dirname, 'client/public/models');
console.log(`  📁 Models directory: ${fs.existsSync(modelsDir) ? 'exists' : 'will be created'}`);

// Check build output directory
console.log('\n🏗️  Checking build output:');
const distDir = path.join(__dirname, 'dist');
const publicDir = path.join(__dirname, 'dist/public');

console.log(`  📁 dist/: ${fs.existsSync(distDir) ? 'exists' : 'will be created'}`);
console.log(`  📁 dist/public/: ${fs.existsSync(publicDir) ? 'exists' : 'will be created'}`);

if (fs.existsSync(path.join(distDir, 'index.js'))) {
  console.log('  ✅ Server bundle exists');
} else {
  console.log('  ⚠️  Server bundle not found (run npm run build)');
}

console.log('\n🚀 Build test complete!');
console.log('\nTo test locally:');
console.log('1. npm install');
console.log('2. npm run setup-models');
console.log('3. npm run build');
console.log('4. npm start');