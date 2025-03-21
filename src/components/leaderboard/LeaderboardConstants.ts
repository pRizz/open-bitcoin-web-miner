import { MAX_MESSAGE_BYTES } from "@/utils/blockchainMessage";

export const nameTagTooltip = "A name tag that is only displayed in the leaderboard and is not added to the blockchain. This is a way to identify yourself in the leaderboard. It is not authenticated, so anyone can claim any name they want.";
export const messageTooltip = "A message that is only displayed in the leaderboard and is not added to the blockchain.";
export const blockchainMessageTooltip = `A message that is added to the coinbase script signature field, if you successfully find a block. UTF-8 text is allowed, with a maximum length of ${MAX_MESSAGE_BYTES} bytes. No control characters allowed.`;
