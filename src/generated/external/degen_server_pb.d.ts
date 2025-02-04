import * as jspb from 'google-protobuf'



export class NoncelessBlockHeader extends jspb.Message {
  getVersion(): Uint8Array | string;
  getVersion_asU8(): Uint8Array;
  getVersion_asB64(): string;
  setVersion(value: Uint8Array | string): NoncelessBlockHeader;

  getPreviousBlockHash(): Uint8Array | string;
  getPreviousBlockHash_asU8(): Uint8Array;
  getPreviousBlockHash_asB64(): string;
  setPreviousBlockHash(value: Uint8Array | string): NoncelessBlockHeader;

  getMerkleRoot(): Uint8Array | string;
  getMerkleRoot_asU8(): Uint8Array;
  getMerkleRoot_asB64(): string;
  setMerkleRoot(value: Uint8Array | string): NoncelessBlockHeader;

  getTimestamp(): Uint8Array | string;
  getTimestamp_asU8(): Uint8Array;
  getTimestamp_asB64(): string;
  setTimestamp(value: Uint8Array | string): NoncelessBlockHeader;

  getCompactTarget(): Uint8Array | string;
  getCompactTarget_asU8(): Uint8Array;
  getCompactTarget_asB64(): string;
  setCompactTarget(value: Uint8Array | string): NoncelessBlockHeader;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): NoncelessBlockHeader.AsObject;
  static toObject(includeInstance: boolean, msg: NoncelessBlockHeader): NoncelessBlockHeader.AsObject;
  static serializeBinaryToWriter(message: NoncelessBlockHeader, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): NoncelessBlockHeader;
  static deserializeBinaryFromReader(message: NoncelessBlockHeader, reader: jspb.BinaryReader): NoncelessBlockHeader;
}

export namespace NoncelessBlockHeader {
  export type AsObject = {
    version: Uint8Array | string,
    previousBlockHash: Uint8Array | string,
    merkleRoot: Uint8Array | string,
    timestamp: Uint8Array | string,
    compactTarget: Uint8Array | string,
  }
}

export class NoncedBlockHeader extends jspb.Message {
  getNoncelessBlockHeader(): NoncelessBlockHeader | undefined;
  setNoncelessBlockHeader(value?: NoncelessBlockHeader): NoncedBlockHeader;
  hasNoncelessBlockHeader(): boolean;
  clearNoncelessBlockHeader(): NoncedBlockHeader;

  getNonce(): Uint8Array | string;
  getNonce_asU8(): Uint8Array;
  getNonce_asB64(): string;
  setNonce(value: Uint8Array | string): NoncedBlockHeader;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): NoncedBlockHeader.AsObject;
  static toObject(includeInstance: boolean, msg: NoncedBlockHeader): NoncedBlockHeader.AsObject;
  static serializeBinaryToWriter(message: NoncedBlockHeader, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): NoncedBlockHeader;
  static deserializeBinaryFromReader(message: NoncedBlockHeader, reader: jspb.BinaryReader): NoncedBlockHeader;
}

export namespace NoncedBlockHeader {
  export type AsObject = {
    noncelessBlockHeader?: NoncelessBlockHeader.AsObject,
    nonce: Uint8Array | string,
  }
}

export class Event extends jspb.Message {
  getEventId(): string;
  setEventId(value: string): Event;

  getEventType(): string;
  setEventType(value: string): Event;

  getEventData(): Uint8Array | string;
  getEventData_asU8(): Uint8Array;
  getEventData_asB64(): string;
  setEventData(value: Uint8Array | string): Event;

  getTimestamp(): number;
  setTimestamp(value: number): Event;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Event.AsObject;
  static toObject(includeInstance: boolean, msg: Event): Event.AsObject;
  static serializeBinaryToWriter(message: Event, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Event;
  static deserializeBinaryFromReader(message: Event, reader: jspb.BinaryReader): Event;
}

export namespace Event {
  export type AsObject = {
    eventId: string,
    eventType: string,
    eventData: Uint8Array | string,
    timestamp: number,
  }
}

export class GetEventsRequest extends jspb.Message {
  getStartTime(): number;
  setStartTime(value: number): GetEventsRequest;

  getEndTime(): number;
  setEndTime(value: number): GetEventsRequest;

  getLimit(): number;
  setLimit(value: number): GetEventsRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetEventsRequest.AsObject;
  static toObject(includeInstance: boolean, msg: GetEventsRequest): GetEventsRequest.AsObject;
  static serializeBinaryToWriter(message: GetEventsRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetEventsRequest;
  static deserializeBinaryFromReader(message: GetEventsRequest, reader: jspb.BinaryReader): GetEventsRequest;
}

export namespace GetEventsRequest {
  export type AsObject = {
    startTime: number,
    endTime: number,
    limit: number,
  }
}

export class GetEventsResponseOk extends jspb.Message {
  getEventsList(): Array<Event>;
  setEventsList(value: Array<Event>): GetEventsResponseOk;
  clearEventsList(): GetEventsResponseOk;
  addEvents(value?: Event, index?: number): Event;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetEventsResponseOk.AsObject;
  static toObject(includeInstance: boolean, msg: GetEventsResponseOk): GetEventsResponseOk.AsObject;
  static serializeBinaryToWriter(message: GetEventsResponseOk, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetEventsResponseOk;
  static deserializeBinaryFromReader(message: GetEventsResponseOk, reader: jspb.BinaryReader): GetEventsResponseOk;
}

export namespace GetEventsResponseOk {
  export type AsObject = {
    eventsList: Array<Event.AsObject>,
  }
}

export class GetEventsResponseError extends jspb.Message {
  getErrorEnum(): GetEventsResponseError.GetEventsResponseErrorEnum;
  setErrorEnum(value: GetEventsResponseError.GetEventsResponseErrorEnum): GetEventsResponseError;

  getErrorMessage(): string;
  setErrorMessage(value: string): GetEventsResponseError;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetEventsResponseError.AsObject;
  static toObject(includeInstance: boolean, msg: GetEventsResponseError): GetEventsResponseError.AsObject;
  static serializeBinaryToWriter(message: GetEventsResponseError, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetEventsResponseError;
  static deserializeBinaryFromReader(message: GetEventsResponseError, reader: jspb.BinaryReader): GetEventsResponseError;
}

export namespace GetEventsResponseError {
  export type AsObject = {
    errorEnum: GetEventsResponseError.GetEventsResponseErrorEnum,
    errorMessage: string,
  }

  export enum GetEventsResponseErrorEnum { 
    UNKNOWN = 0,
    INVALIDTIMESTAMP = 1,
    INVALIDLIMIT = 2,
  }
}

export class GetEventsResponse extends jspb.Message {
  getOk(): GetEventsResponseOk | undefined;
  setOk(value?: GetEventsResponseOk): GetEventsResponse;
  hasOk(): boolean;
  clearOk(): GetEventsResponse;

  getError(): GetEventsResponseError | undefined;
  setError(value?: GetEventsResponseError): GetEventsResponse;
  hasError(): boolean;
  clearError(): GetEventsResponse;

  getResultCase(): GetEventsResponse.ResultCase;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetEventsResponse.AsObject;
  static toObject(includeInstance: boolean, msg: GetEventsResponse): GetEventsResponse.AsObject;
  static serializeBinaryToWriter(message: GetEventsResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetEventsResponse;
  static deserializeBinaryFromReader(message: GetEventsResponse, reader: jspb.BinaryReader): GetEventsResponse;
}

export namespace GetEventsResponse {
  export type AsObject = {
    ok?: GetEventsResponseOk.AsObject,
    error?: GetEventsResponseError.AsObject,
  }

  export enum ResultCase { 
    RESULT_NOT_SET = 0,
    OK = 1,
    ERROR = 2,
  }
}

export class StreamingWorkClientMessage extends jspb.Message {
  getChallengeRequest(): StreamingWorkChallengeRequest | undefined;
  setChallengeRequest(value?: StreamingWorkChallengeRequest): StreamingWorkClientMessage;
  hasChallengeRequest(): boolean;
  clearChallengeRequest(): StreamingWorkClientMessage;

  getSubmissionRequest(): StreamingWorkSubmissionRequest | undefined;
  setSubmissionRequest(value?: StreamingWorkSubmissionRequest): StreamingWorkClientMessage;
  hasSubmissionRequest(): boolean;
  clearSubmissionRequest(): StreamingWorkClientMessage;

  getContentCase(): StreamingWorkClientMessage.ContentCase;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): StreamingWorkClientMessage.AsObject;
  static toObject(includeInstance: boolean, msg: StreamingWorkClientMessage): StreamingWorkClientMessage.AsObject;
  static serializeBinaryToWriter(message: StreamingWorkClientMessage, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): StreamingWorkClientMessage;
  static deserializeBinaryFromReader(message: StreamingWorkClientMessage, reader: jspb.BinaryReader): StreamingWorkClientMessage;
}

export namespace StreamingWorkClientMessage {
  export type AsObject = {
    challengeRequest?: StreamingWorkChallengeRequest.AsObject,
    submissionRequest?: StreamingWorkSubmissionRequest.AsObject,
  }

  export enum ContentCase { 
    CONTENT_NOT_SET = 0,
    CHALLENGE_REQUEST = 1,
    SUBMISSION_REQUEST = 2,
  }
}

export class StreamingWorkServerMessage extends jspb.Message {
  getChallengeResponse(): StreamingWorkChallengeResponse | undefined;
  setChallengeResponse(value?: StreamingWorkChallengeResponse): StreamingWorkServerMessage;
  hasChallengeResponse(): boolean;
  clearChallengeResponse(): StreamingWorkServerMessage;

  getSubmissionResponse(): StreamingWorkSubmissionResponse | undefined;
  setSubmissionResponse(value?: StreamingWorkSubmissionResponse): StreamingWorkServerMessage;
  hasSubmissionResponse(): boolean;
  clearSubmissionResponse(): StreamingWorkServerMessage;

  getBlockTemplateUpdate(): BlockTemplateUpdate | undefined;
  setBlockTemplateUpdate(value?: BlockTemplateUpdate): StreamingWorkServerMessage;
  hasBlockTemplateUpdate(): boolean;
  clearBlockTemplateUpdate(): StreamingWorkServerMessage;

  getContentCase(): StreamingWorkServerMessage.ContentCase;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): StreamingWorkServerMessage.AsObject;
  static toObject(includeInstance: boolean, msg: StreamingWorkServerMessage): StreamingWorkServerMessage.AsObject;
  static serializeBinaryToWriter(message: StreamingWorkServerMessage, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): StreamingWorkServerMessage;
  static deserializeBinaryFromReader(message: StreamingWorkServerMessage, reader: jspb.BinaryReader): StreamingWorkServerMessage;
}

export namespace StreamingWorkServerMessage {
  export type AsObject = {
    challengeResponse?: StreamingWorkChallengeResponse.AsObject,
    submissionResponse?: StreamingWorkSubmissionResponse.AsObject,
    blockTemplateUpdate?: BlockTemplateUpdate.AsObject,
  }

  export enum ContentCase { 
    CONTENT_NOT_SET = 0,
    CHALLENGE_RESPONSE = 1,
    SUBMISSION_RESPONSE = 2,
    BLOCK_TEMPLATE_UPDATE = 3,
  }
}

export class StreamingWorkChallengeRequest extends jspb.Message {
  getMinLeadingZeroCountU8(): number;
  setMinLeadingZeroCountU8(value: number): StreamingWorkChallengeRequest;

  getMinSolutionCountU32(): number;
  setMinSolutionCountU32(value: number): StreamingWorkChallengeRequest;

  getRequestorServiceName(): string;
  setRequestorServiceName(value: string): StreamingWorkChallengeRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): StreamingWorkChallengeRequest.AsObject;
  static toObject(includeInstance: boolean, msg: StreamingWorkChallengeRequest): StreamingWorkChallengeRequest.AsObject;
  static serializeBinaryToWriter(message: StreamingWorkChallengeRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): StreamingWorkChallengeRequest;
  static deserializeBinaryFromReader(message: StreamingWorkChallengeRequest, reader: jspb.BinaryReader): StreamingWorkChallengeRequest;
}

export namespace StreamingWorkChallengeRequest {
  export type AsObject = {
    minLeadingZeroCountU8: number,
    minSolutionCountU32: number,
    requestorServiceName: string,
  }
}

export class StreamingWorkChallengeResponse extends jspb.Message {
  getJobId(): string;
  setJobId(value: string): StreamingWorkChallengeResponse;

  getNoncelessBlockHeader(): NoncelessBlockHeader | undefined;
  setNoncelessBlockHeader(value?: NoncelessBlockHeader): StreamingWorkChallengeResponse;
  hasNoncelessBlockHeader(): boolean;
  clearNoncelessBlockHeader(): StreamingWorkChallengeResponse;

  getHashTargetLeadingZeroCountU8(): number;
  setHashTargetLeadingZeroCountU8(value: number): StreamingWorkChallengeResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): StreamingWorkChallengeResponse.AsObject;
  static toObject(includeInstance: boolean, msg: StreamingWorkChallengeResponse): StreamingWorkChallengeResponse.AsObject;
  static serializeBinaryToWriter(message: StreamingWorkChallengeResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): StreamingWorkChallengeResponse;
  static deserializeBinaryFromReader(message: StreamingWorkChallengeResponse, reader: jspb.BinaryReader): StreamingWorkChallengeResponse;
}

export namespace StreamingWorkChallengeResponse {
  export type AsObject = {
    jobId: string,
    noncelessBlockHeader?: NoncelessBlockHeader.AsObject,
    hashTargetLeadingZeroCountU8: number,
  }
}

export class StreamingWorkSubmissionRequest extends jspb.Message {
  getJobId(): string;
  setJobId(value: string): StreamingWorkSubmissionRequest;

  getNoncedBlockHeadersList(): Array<NoncedBlockHeader>;
  setNoncedBlockHeadersList(value: Array<NoncedBlockHeader>): StreamingWorkSubmissionRequest;
  clearNoncedBlockHeadersList(): StreamingWorkSubmissionRequest;
  addNoncedBlockHeaders(value?: NoncedBlockHeader, index?: number): NoncedBlockHeader;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): StreamingWorkSubmissionRequest.AsObject;
  static toObject(includeInstance: boolean, msg: StreamingWorkSubmissionRequest): StreamingWorkSubmissionRequest.AsObject;
  static serializeBinaryToWriter(message: StreamingWorkSubmissionRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): StreamingWorkSubmissionRequest;
  static deserializeBinaryFromReader(message: StreamingWorkSubmissionRequest, reader: jspb.BinaryReader): StreamingWorkSubmissionRequest;
}

export namespace StreamingWorkSubmissionRequest {
  export type AsObject = {
    jobId: string,
    noncedBlockHeadersList: Array<NoncedBlockHeader.AsObject>,
  }
}

export class StreamingWorkSubmissionResponse extends jspb.Message {
  getStatus(): StreamingWorkSubmissionResponse.Status;
  setStatus(value: StreamingWorkSubmissionResponse.Status): StreamingWorkSubmissionResponse;

  getMessage(): string;
  setMessage(value: string): StreamingWorkSubmissionResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): StreamingWorkSubmissionResponse.AsObject;
  static toObject(includeInstance: boolean, msg: StreamingWorkSubmissionResponse): StreamingWorkSubmissionResponse.AsObject;
  static serializeBinaryToWriter(message: StreamingWorkSubmissionResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): StreamingWorkSubmissionResponse;
  static deserializeBinaryFromReader(message: StreamingWorkSubmissionResponse, reader: jspb.BinaryReader): StreamingWorkSubmissionResponse;
}

export namespace StreamingWorkSubmissionResponse {
  export type AsObject = {
    status: StreamingWorkSubmissionResponse.Status,
    message: string,
  }

  export enum Status { 
    ACCEPTED = 0,
    REJECTED = 1,
    OUTDATED = 2,
    ACCEPTED_AND_FOUND_BLOCK = 3,
  }
}

export class BlockTemplateUpdate extends jspb.Message {
  getNoncelessBlockHeader(): NoncelessBlockHeader | undefined;
  setNoncelessBlockHeader(value?: NoncelessBlockHeader): BlockTemplateUpdate;
  hasNoncelessBlockHeader(): boolean;
  clearNoncelessBlockHeader(): BlockTemplateUpdate;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): BlockTemplateUpdate.AsObject;
  static toObject(includeInstance: boolean, msg: BlockTemplateUpdate): BlockTemplateUpdate.AsObject;
  static serializeBinaryToWriter(message: BlockTemplateUpdate, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): BlockTemplateUpdate;
  static deserializeBinaryFromReader(message: BlockTemplateUpdate, reader: jspb.BinaryReader): BlockTemplateUpdate;
}

export namespace BlockTemplateUpdate {
  export type AsObject = {
    noncelessBlockHeader?: NoncelessBlockHeader.AsObject,
  }
}

export class GetBitcoinNetworkInfoRequest extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetBitcoinNetworkInfoRequest.AsObject;
  static toObject(includeInstance: boolean, msg: GetBitcoinNetworkInfoRequest): GetBitcoinNetworkInfoRequest.AsObject;
  static serializeBinaryToWriter(message: GetBitcoinNetworkInfoRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetBitcoinNetworkInfoRequest;
  static deserializeBinaryFromReader(message: GetBitcoinNetworkInfoRequest, reader: jspb.BinaryReader): GetBitcoinNetworkInfoRequest;
}

export namespace GetBitcoinNetworkInfoRequest {
  export type AsObject = {
  }
}

export class GetBitcoinNetworkInfoResponseOk extends jspb.Message {
  getBlockHeight(): number;
  setBlockHeight(value: number): GetBitcoinNetworkInfoResponseOk;

  getNetworkDifficulty(): number;
  setNetworkDifficulty(value: number): GetBitcoinNetworkInfoResponseOk;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetBitcoinNetworkInfoResponseOk.AsObject;
  static toObject(includeInstance: boolean, msg: GetBitcoinNetworkInfoResponseOk): GetBitcoinNetworkInfoResponseOk.AsObject;
  static serializeBinaryToWriter(message: GetBitcoinNetworkInfoResponseOk, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetBitcoinNetworkInfoResponseOk;
  static deserializeBinaryFromReader(message: GetBitcoinNetworkInfoResponseOk, reader: jspb.BinaryReader): GetBitcoinNetworkInfoResponseOk;
}

export namespace GetBitcoinNetworkInfoResponseOk {
  export type AsObject = {
    blockHeight: number,
    networkDifficulty: number,
  }
}

export class GetBitcoinNetworkInfoResponseError extends jspb.Message {
  getErrorEnum(): GetBitcoinNetworkInfoResponseError.GetBitcoinNetworkInfoErrorEnum;
  setErrorEnum(value: GetBitcoinNetworkInfoResponseError.GetBitcoinNetworkInfoErrorEnum): GetBitcoinNetworkInfoResponseError;

  getErrorMessage(): string;
  setErrorMessage(value: string): GetBitcoinNetworkInfoResponseError;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetBitcoinNetworkInfoResponseError.AsObject;
  static toObject(includeInstance: boolean, msg: GetBitcoinNetworkInfoResponseError): GetBitcoinNetworkInfoResponseError.AsObject;
  static serializeBinaryToWriter(message: GetBitcoinNetworkInfoResponseError, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetBitcoinNetworkInfoResponseError;
  static deserializeBinaryFromReader(message: GetBitcoinNetworkInfoResponseError, reader: jspb.BinaryReader): GetBitcoinNetworkInfoResponseError;
}

export namespace GetBitcoinNetworkInfoResponseError {
  export type AsObject = {
    errorEnum: GetBitcoinNetworkInfoResponseError.GetBitcoinNetworkInfoErrorEnum,
    errorMessage: string,
  }

  export enum GetBitcoinNetworkInfoErrorEnum { 
    UNKNOWN = 0,
    BITCOINNODENOTCONNECTED = 1,
    BITCOINNODESYNCING = 2,
  }
}

export class GetBitcoinNetworkInfoResponse extends jspb.Message {
  getOk(): GetBitcoinNetworkInfoResponseOk | undefined;
  setOk(value?: GetBitcoinNetworkInfoResponseOk): GetBitcoinNetworkInfoResponse;
  hasOk(): boolean;
  clearOk(): GetBitcoinNetworkInfoResponse;

  getError(): GetBitcoinNetworkInfoResponseError | undefined;
  setError(value?: GetBitcoinNetworkInfoResponseError): GetBitcoinNetworkInfoResponse;
  hasError(): boolean;
  clearError(): GetBitcoinNetworkInfoResponse;

  getResultCase(): GetBitcoinNetworkInfoResponse.ResultCase;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetBitcoinNetworkInfoResponse.AsObject;
  static toObject(includeInstance: boolean, msg: GetBitcoinNetworkInfoResponse): GetBitcoinNetworkInfoResponse.AsObject;
  static serializeBinaryToWriter(message: GetBitcoinNetworkInfoResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetBitcoinNetworkInfoResponse;
  static deserializeBinaryFromReader(message: GetBitcoinNetworkInfoResponse, reader: jspb.BinaryReader): GetBitcoinNetworkInfoResponse;
}

export namespace GetBitcoinNetworkInfoResponse {
  export type AsObject = {
    ok?: GetBitcoinNetworkInfoResponseOk.AsObject,
    error?: GetBitcoinNetworkInfoResponseError.AsObject,
  }

  export enum ResultCase { 
    RESULT_NOT_SET = 0,
    OK = 1,
    ERROR = 2,
  }
}

