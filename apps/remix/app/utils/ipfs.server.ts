import pinataSDK from '@pinata/sdk';
import dotenv from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import type { BattleBotMetadataSchemaType } from "../schemas/battleBot.js";

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '../../../../apps/remix/.env');
console.log('Loading environment variables from:', envPath);

const result = dotenv.config({ path: envPath });
if (result.error) {
  console.error('Error loading .env file:', result.error);
  throw new Error('Failed to load environment variables');
}

// Debug: Check environment variables
console.log('IPFS Server - Environment variables:', {
  PINATA_JWT: process.env.PINATA_JWT ? 'Set' : 'Not set',
  PINATA_API_KEY: process.env.PINATA_API_KEY ? 'Set' : 'Not set',
  PINATA_API_SECRET: process.env.PINATA_API_SECRET ? 'Set' : 'Not set'
});

// Initialize Pinata client
const pinata = (() => {
  const jwt = process.env.PINATA_JWT;
  const apiKey = process.env.PINATA_API_KEY;
  const apiSecret = process.env.PINATA_API_SECRET;

  if (jwt) {
    console.log('Using JWT for Pinata authentication');
    return new pinataSDK({ pinataJWTKey: jwt });
  } else if (apiKey && apiSecret) {
    console.log('Using API Key/Secret for Pinata authentication');
    return new pinataSDK({ pinataApiKey: apiKey, pinataSecretApiKey: apiSecret });
  } else {
    throw new Error('Pinata credentials not found in environment variables');
  }
})();

export async function uploadToIPFS(metadata: BattleBotMetadataSchemaType): Promise<string> {
  try {
    // Upload metadata to IPFS through Pinata
    const result = await pinata.pinJSONToIPFS(metadata, {
      pinataMetadata: {
        name: `BattleBot-${metadata.name}`,
      },
      pinataOptions: {
        cidVersion: 1
      }
    });
    
    // Construct the IPFS URI
    const ipfsUri = `ipfs://${result.IpfsHash}`;
    
    // Log the IPFS URI and gateway URL for easy access
    console.log('Metadata uploaded to IPFS:', ipfsUri);
    console.log('Gateway URL:', `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`);
    
    return ipfsUri;
  } catch (error) {
    console.error('Error uploading to IPFS:', error);
    throw new Error('Failed to upload metadata to IPFS');
  }
} 