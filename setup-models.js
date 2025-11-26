import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MODEL_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';
const MODELS_DIR = path.join(__dirname, 'client', 'public', 'models');

const models = [
  'tiny_face_detector_model-weights_manifest.json',
  'tiny_face_detector_model-shard1',
  'face_landmark_68_model-weights_manifest.json', 
  'face_landmark_68_model-shard1',
  'face_expression_model-weights_manifest.json',
  'face_expression_model-shard1'
];

// Ensure models directory exists
if (!fs.existsSync(MODELS_DIR)) {
  fs.mkdirSync(MODELS_DIR, { recursive: true });
}

console.log('Downloading face-api.js models...');

const downloadModel = (modelName) => {
  return new Promise((resolve, reject) => {
    const url = `${MODEL_URL}/${modelName}`;
    const filePath = path.join(MODELS_DIR, modelName);
    
    const file = fs.createWriteStream(filePath);
    
    https.get(url, (response) => {
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log(`✓ Downloaded ${modelName}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filePath, () => {}); // Delete partial file
      console.error(`✗ Failed to download ${modelName}:`, err.message);
      reject(err);
    });
  });
};

// Download all models
Promise.all(models.map(downloadModel))
  .then(() => {
    console.log('\n✅ All face detection models downloaded successfully!');
    console.log('You can now use face analysis features in your interview platform.');
  })
  .catch((err) => {
    console.error('\n❌ Failed to download some models:', err);
    console.log('Face analysis may not work properly.');
  });