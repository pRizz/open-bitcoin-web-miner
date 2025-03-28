/// Types that mirror the Rust WebSocket protocol
/// Bitcoin block headers use little-endian encoding for the version, timestamp, target, and nonce. <- Verify this.
export interface NoncelessBlockHeader {
    version: number[]; // 4 bytes
    previous_block_hash: number[]; // 32 bytes
    merkle_root: number[]; // 32 bytes
    timestamp: number[]; // 4 bytes
    compact_target: number[]; // 4 bytes
  }

export interface MiningChallengeResponse {
    nonceless_block_header: NoncelessBlockHeader;
    target_leading_zero_count: number;
  }

export interface MiningSubmission {
    nonceVecU8: number[];
    nonceless_block_header: NoncelessBlockHeader;
  }

export enum MiningSubmissionStatus {
  ACCEPTED = 0,
  REJECTED = 1,
  OUTDATED = 2,
  ACCEPTED_AND_FOUND_BLOCK = 3,
}

export interface WorkMetadata {
  block_header_hash: number[];
  block_height: number;
  status: MiningSubmissionStatus;
  maybe_rejection_reason?: string | null;
}

export interface MiningSubmissionResponse {
    maybe_difficulty_update?: DifficultyUpdate;
    work_metadata: WorkMetadata[];
  }

export interface DifficultyUpdate {
    new_min_leading_zero_count: number;
  }

export interface BlockTemplateUpdate {
    nonceless_block_header: NoncelessBlockHeader;
  }

export interface LeaderboardAddSuccess {
  block_hash_hex: string;
  rank: number;
  leading_binary_zeroes: number;
}

export type WebSocketServerMessage =
    | { type: "ChallengeResponse"; data: MiningChallengeResponse }
    | { type: "SubmissionResponse"; data: MiningSubmissionResponse }
    | { type: "BlockTemplateUpdate"; data: BlockTemplateUpdate }
    | { type: "LeaderboardAddSuccess"; data: LeaderboardAddSuccess };

export type WebSocketClientMessage =
    | { type: "Submission"; data: MiningSubmission }
    | { type: "StartMining"; data: {
        maybeBtcRewardAddress?: string | null,
        maybeBlockchainMessage?: string | null,
        maybeLeaderboardUsername?: string | null,
        maybeLeaderboardMessage?: string | null
      } };

export function serializeBlockHeader(header: NoncelessBlockHeader, nonce: number): Uint8Array {
  if (
    header.version.length !== 4 ||
        header.previous_block_hash.length !== 32 ||
        header.merkle_root.length !== 32 ||
        header.timestamp.length !== 4 ||
        header.compact_target.length !== 4
  ) {
    throw new Error("Invalid block header field lengths");
  }

  // Create an 80-byte buffer
  const buffer = new Uint8Array(80);
  let offset = 0;

  // Helper function to copy arrays into the buffer
  function copyToBuffer(source: number[], length: number) {
    if (source.length !== length) throw new Error("Invalid field length");
    buffer.set(source, offset);
    offset += length;
  }

  // Copy fields in order
  copyToBuffer(header.version, 4);
  copyToBuffer(header.previous_block_hash, 32);
  copyToBuffer(header.merkle_root, 32);
  copyToBuffer(header.timestamp, 4);
  copyToBuffer(header.compact_target, 4);

  // Convert nonce (number) to 4-byte little-endian array
  buffer.set(serializeNonceLE(nonce), offset);

  return buffer;
}

export function serializeNonceLE(nonce: number): Uint8Array {
  return new Uint8Array([
    nonce & 0xff,
    (nonce >> 8) & 0xff,
    (nonce >> 16) & 0xff,
    (nonce >> 24) & 0xff
  ]);
}

/**
 * Deserializes a nonce from a Uint8Array in little-endian order
 * @param nonceArray - The Uint8Array to deserialize
 * @returns The deserialized nonce as a number
 */
export function deserializeNonceLE(nonceArray: Uint8Array): number {
  return (nonceArray[0] << 0) |
        (nonceArray[1] << 8) |
        (nonceArray[2] << 16) |
        (nonceArray[3] << 24);
}
