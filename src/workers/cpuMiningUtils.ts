import { NoncelessBlockHeader, serializeNoncelessBlockHeader, serializeNonceLE } from "@/types/websocket";
import { nonceToU8ArrayBE } from "@/utils/nonceUtils";

// Deprecated; use doubleSha256BlockHeaderU8Array instead
async function sha256(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataUint8Array = encoder.encode(message);
  const hashArrayBuffer = await crypto.subtle.digest('SHA-256', dataUint8Array);

  // Convert buffer to hex string
  const hashArray = Array.from(new Uint8Array(hashArrayBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return hashHex;
}

// Deprecated; use doubleSha256BlockHeaderU8Array instead
export async function doubleSha256BlockHeader(blockHeader: NoncelessBlockHeader, nonce: number): Promise<string> {
  const dataUint8Array = serializeNoncelessBlockHeader(blockHeader, nonce);
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

// FIXME: serializeBlockHeader is expensive; we should modify an existing serialized block header instead of serializing it again every time
// Deprecated; use doubleSha256BlockHeaderU8Array instead
// This method ran at about 40kH/s on my M4 Macbook Pro on 1 thread
async function _doubleSha256BlockHeaderReturningU8Array(blockHeader: NoncelessBlockHeader, nonce: number): Promise<Uint8Array> {
  const dataUint8Array = serializeNoncelessBlockHeader(blockHeader, nonce);
  const hashArrayBuffer = await crypto.subtle.digest('SHA-256', dataUint8Array);
  const hashArrayBuffer2 = await crypto.subtle.digest('SHA-256', hashArrayBuffer);

  return new Uint8Array(hashArrayBuffer2).reverse();
}

// Potentially not type safe, but it's a hack to avoid serializing the block header every time we hash. TODO: wrap the Uint8Array in a more type safe object.
// Assumes blockHeaderAsU8Array is already 80 bytes long
// This runs at about 48kH/s on my M4 Macbook Pro on 1 thread; improves performance by about 20% over doubleSha256BlockHeaderReturningU8Array
export async function doubleSha256BlockHeaderU8Array(
  blockHeaderAsU8Array: Uint8Array<ArrayBuffer>,
  nonce: number,
): Promise<Uint8Array> {
  blockHeaderAsU8Array.set(serializeNonceLE(nonce), 76);
  // console.log("doubleSha256BlockHeaderU8Array: blockHeaderAsU8Array", blockHeaderAsU8Array);
  return new Uint8Array(await doubleSha256(blockHeaderAsU8Array)).reverse();
}

export async function doubleSha256(data: BufferSource): Promise<ArrayBuffer> {
  const hashArrayBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArrayBuffer2 = await crypto.subtle.digest('SHA-256', hashArrayBuffer);

  return hashArrayBuffer2;
}
