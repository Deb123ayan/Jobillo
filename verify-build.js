import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Verifies that the build output exists and contains all required files
 * Exits with code 0 if verification passes, code 1 if it fails
 */
function verifyBuild() {
  console.log('🔍 Verifying build output...\n');
  console.log('Debug Info:');
  console.log(`  - __dirname: ${__dirname}`);
  console.log(`  - process.cwd(): ${process.cwd()}`);

  const distPublicPath = path.resolve(__dirname, 'dist', 'public');
  const distServerPath = path.resolve(__dirname, 'dist', 'index.js');
  
  const requiredPaths = [
    { path: distPublicPath, type: 'directory', name: 'dist/public' },
    { path: path.join(distPublicPath, 'index.html'), type: 'file', name: 'dist/public/index.html' },
    { path: path.join(distPublicPath, 'assets'), type: 'directory', name: 'dist/public/assets' },
    { path: distServerPath, type: 'file', name: 'dist/index.js' }
  ];

  const missingPaths = [];
  let allChecksPass = true;

  console.log('Checking required paths:');
  
  for (const item of requiredPaths) {
    const exists = fs.existsSync(item.path);
    
    if (exists) {
      const stats = fs.statSync(item.path);
      const isCorrectType = item.type === 'directory' ? stats.isDirectory() : stats.isFile();
      
      if (isCorrectType) {
        console.log(`  ✅ ${item.name} - Found`);
        
        // For directories, show file count
        if (item.type === 'directory') {
          const files = fs.readdirSync(item.path);
          console.log(`     (contains ${files.length} items)`);
        }
      } else {
        console.log(`  ❌ ${item.name} - Wrong type (expected ${item.type})`);
        missingPaths.push(item.name);
        allChecksPass = false;
      }
    } else {
      console.log(`  ❌ ${item.name} - Not found`);
      missingPaths.push(item.name);
      allChecksPass = false;
    }
  }

  console.log('');

  if (allChecksPass) {
    console.log('✅ Build verification passed! All required files are present.\n');
    
    // Show summary of what was built
    const publicFiles = fs.readdirSync(distPublicPath);
    console.log('Build output summary:');
    console.log(`  - dist/public contains: ${publicFiles.join(', ')}`);
    
    if (fs.existsSync(path.join(distPublicPath, 'assets'))) {
      const assetFiles = fs.readdirSync(path.join(distPublicPath, 'assets'));
      console.log(`  - dist/public/assets contains ${assetFiles.length} files`);
    }
    
    return { success: true, missingPaths: [], message: 'Build verification passed' };
  } else {
    console.error('❌ Build verification failed!\n');
    console.error('Missing or incorrect paths:');
    missingPaths.forEach(p => console.error(`  - ${p}`));
    console.error('\nPlease ensure the build process completed successfully.');
    console.error('Expected structure:');
    console.error('  dist/');
    console.error('  ├── index.js          (server bundle)');
    console.error('  └── public/           (client assets)');
    console.error('      ├── index.html');
    console.error('      └── assets/       (JS/CSS bundles)');
    
    return { success: false, missingPaths, message: 'Build verification failed' };
  }
}

// Run verification
const result = verifyBuild();
process.exit(result.success ? 0 : 1);
