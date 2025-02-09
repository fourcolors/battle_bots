// Load environment variables first
import dotenv from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '../../../../apps/remix/.env');
console.log('Loading environment variables from:', envPath);

// Load environment variables
const result = dotenv.config({ path: envPath });
if (result.error) {
  console.error('Error loading .env file:', result.error);
  process.exit(1);
}

// Import the rest after environment variables are loaded
import type { BattleBotMetadataSchemaType } from '../schemas/battleBot.js';
import { uploadToIPFS } from './ipfs.server.js';

// Debug: Check environment variables
console.log('Environment variables loaded:', {
  PINATA_JWT: process.env.PINATA_JWT ? 'Set' : 'Not set',
  PINATA_API_KEY: process.env.PINATA_API_KEY ? 'Set' : 'Not set',
  PINATA_API_SECRET: process.env.PINATA_API_SECRET ? 'Set' : 'Not set'
});

async function testIPFSUpload() {
  // Create a sample BattleBot metadata
  const sampleMetadata: BattleBotMetadataSchemaType = {
    version: 1,
    name: "Test Battle Bot #1",
    battlePrompt: "A strategic combat AI that specializes in calculated strikes",
    image: "ipfs://placeholder",
    attributes: {
      attack: 75,
      defense: 60,
      speed: 85,
      mainWeapon: 1
    }
  };

  try {
    console.log('Uploading test metadata to IPFS via Pinata...');
    const ipfsUri = await uploadToIPFS(sampleMetadata);
    console.log('Upload successful!');
    console.log('IPFS URI:', ipfsUri);
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testIPFSUpload(); 