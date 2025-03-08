
// Types that mirror the Rust WebSocket protocol
export interface NoncelessBlockHeader {
    version: number[];
    previous_block_hash: number[];
    timestamp: number[];
    compact_target: number[];
    merkle_root: number[];
  }
  
  export interface MiningChallengeResponse {
    job_id: string;
    nonceless_block_header: NoncelessBlockHeader;
    target_leading_zero_count: number;
  }
  
  export interface MiningSubmission {
    job_id: string;
    nonce: number[];
    nonceless_block_header: NoncelessBlockHeader;
  }
  
  export interface MiningSubmissionResponse {
    status: number;
    message: string;
  }
  
  export interface BlockTemplateUpdate {
    nonceless_block_header: NoncelessBlockHeader;
  }
  
  export type WebSocketServerMessage = 
    | { type: "ChallengeResponse"; data: MiningChallengeResponse }
    | { type: "SubmissionResponse"; data: MiningSubmissionResponse }
    | { type: "BlockTemplateUpdate"; data: BlockTemplateUpdate };
  
  export type WebSocketClientMessage = {
    type: "Submission";
    data: MiningSubmission;
  };
  