export const BITCOIN_PHRASES = [
  "There is no second best",
  "Not your keys, not your coins",
  "Be your own bank",
  "Time is money, Bitcoin is both",
  "In code we trust",
  "The future of money is digital",
  "Decentralize everything",
  "Bitcoin: The internet of money",
  "HODL for the future",
  "The hardest money ever created",
  "Bitcoin fixes this",
  "The revolution will be decentralized",
  "Sound money for a sound society",
  "Bitcoin: The people's money",
  "The future is decentralized",
  "Bitcoin: The ultimate scarce asset",
  "The internet of value",
  "The unstoppable force of Bitcoin",
  "Bitcoin: The money of the future",
  "Don't trust, verify",
  "The future is Bitcoin",
  "The future is now",
  "The future is here",
  "Nothing stops this train",
] as const;

export function getRandomBitcoinPhrase(): string {
  const randomIndex = Math.floor(Math.random() * BITCOIN_PHRASES.length);
  return BITCOIN_PHRASES[randomIndex];
}