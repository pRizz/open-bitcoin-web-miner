import { NoncelessBlockHeader, serializeBlockHeader } from "@/types/websocket";

async function sha256(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataUint8Array = encoder.encode(message);
  const hashArrayBuffer = await crypto.subtle.digest('SHA-256', dataUint8Array);

  // Convert buffer to hex string
  const hashArray = Array.from(new Uint8Array(hashArrayBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return hashHex;
}

export async function doubleSha256BlockHeader(blockHeader: NoncelessBlockHeader, nonce: number): Promise<string> {
  const dataUint8Array = serializeBlockHeader(blockHeader, nonce);
  const hashArrayBuffer = await crypto.subtle.digest('SHA-256', dataUint8Array);
  const hashArrayBuffer2 = await crypto.subtle.digest('SHA-256', hashArrayBuffer);

  // Convert buffer to hex string
  const hashArray = Array.from(new Uint8Array(hashArrayBuffer2)).reverse();
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return hashHex;
}

export function performHash(blockHeader: NoncelessBlockHeader, nonce: number): string {
  // TODO: Implement actual SHA-256 hashing
  let hash = '';
  const chars = '0123456789abcdef';
  // FIXME lol
  for (let i = 0; i < 64; i++) {
    hash += chars[Math.floor(Math.random() * 16)];
  }
  return hash;
}
