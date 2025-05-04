/// Types that mirror the Rust WebSocket protocol
/// Bitcoin block headers use little-endian encoding for the version, timestamp, target, and nonce. <- Verify this.
export interface NoncelessBlockHeader {
    version_hex: string; // 4 underlying bytes, 8 character hex string
    previous_block_hash_hex: string; // 32 underlying bytes, 64 character hex string; ends with the zeros; need to reverse when displaying
    merkle_root_hex: string; // 32 underlying bytes, 64 character hex string
    timestamp_hex: string; // 4 underlying bytes, 8 character hex string
    compact_target_hex: string; // 4 underlying bytes, 8 character hex string
  }

export interface MiningChallengeResponse extends HasFullProofOfReward {
    target_leading_zero_count: number;
  }

export interface MiningSubmission {
    nonceHex: string; // 4 underlying bytes, 8 character hex string
    nonceless_block_header: NoncelessBlockHeader;
  }

export interface ProofOfReward {
  public_block_template_download_link: string;
  block_template_fetch_time_unix_seconds: number;
  coinbase_transaction_hex: string;
}

export enum MiningSubmissionStatus {
  ACCEPTED = 0,
  REJECTED = 1,
  OUTDATED = 2,
  ACCEPTED_AND_FOUND_BLOCK = 3,
}

export interface WorkMetadata {
  block_header_hash_hex: string; // 32 underlying bytes, 64 character hex string
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

export interface BlockTemplateUpdate extends HasFullProofOfReward {}

export interface HasFullProofOfReward {
  nonceless_block_header: NoncelessBlockHeader;
  proof_of_reward: ProofOfReward;
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
    header.version_hex.length !== 8 ||
        header.previous_block_hash_hex.length !== 64 ||
        header.merkle_root_hex.length !== 64 ||
        header.timestamp_hex.length !== 8 ||
        header.compact_target_hex.length !== 8
  ) {
    throw new Error("Invalid block header field lengths");
  }

  const version_bytes = header.version_hex.match(/.{1,2}/g)?.map(byteString => parseInt(byteString, 16)) ?? [];
  const previous_block_hash_bytes = header.previous_block_hash_hex.match(/.{1,2}/g)?.map(byteString => parseInt(byteString, 16)) ?? [];
  const merkle_root_bytes = header.merkle_root_hex.match(/.{1,2}/g)?.map(byteString => parseInt(byteString, 16)) ?? [];
  const timestamp_bytes = header.timestamp_hex.match(/.{1,2}/g)?.map(byteString => parseInt(byteString, 16)) ?? [];
  const compact_target_bytes = header.compact_target_hex.match(/.{1,2}/g)?.map(byteString => parseInt(byteString, 16)) ?? [];

  // Create an 80-byte buffer
  const buffer = new Uint8Array(80);
  let accumulatedOffset = 0;

  // Helper function to copy arrays into the buffer
  function copyToBuffer(source: ArrayLike<number>, length: number) {
    if (source.length !== length) throw new Error("Invalid field length");
    buffer.set(source, accumulatedOffset);
    accumulatedOffset += length;
  }

  // Copy fields in order
  copyToBuffer(version_bytes, 4);
  copyToBuffer(previous_block_hash_bytes, 32);
  copyToBuffer(merkle_root_bytes, 32);
  copyToBuffer(timestamp_bytes, 4);
  copyToBuffer(compact_target_bytes, 4);
  // Convert nonce (number) to 4-byte little-endian array
  // Nonce gets added at offset 4 + 32 + 32 + 4 + 4 = 76
  copyToBuffer(serializeNonceLE(nonce), 4);

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
