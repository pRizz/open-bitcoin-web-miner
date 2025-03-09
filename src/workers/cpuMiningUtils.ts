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

export async function performHash(blockHeader: NoncelessBlockHeader, nonce: number): Promise<string> {
  return doubleSha256BlockHeader(blockHeader, nonce);
}
