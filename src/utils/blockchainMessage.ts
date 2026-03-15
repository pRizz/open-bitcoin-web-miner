export const MAX_MESSAGE_BYTES = 80;

function containsControlCharacter(value: string): boolean {
  return Array.from(value).some((character) => {
    const charCode = character.charCodeAt(0);
    return charCode <= 0x1f || charCode === 0x7f;
  });
}

/**
 * Returns an error message if the message is invalid, or undefined if it's valid
 * @param message - The message to validate
 * @returns An error message if the message is invalid, or undefined if it's valid
 */
export function validateBlockchainMessage(message: string | null): string | undefined {
  if (!message) return undefined;

  // Check for control characters
  if (containsControlCharacter(message)) {
    return "Message cannot contain control characters";
  }

  // Check UTF-8 byte length
  const encoder = new TextEncoder();
  const byteLength = encoder.encode(message).length;
  if (byteLength > MAX_MESSAGE_BYTES) {
    return `Message is too long (${byteLength} bytes). Maximum length is ${MAX_MESSAGE_BYTES} bytes when UTF-8 encoded`;
  }

  return undefined;
}

/**
 * Returns the byte length of the message
 * @param message - The message to get the byte length of
 * @returns The byte length of the message
 */
export function getMessageByteLength(message: string | null): number {
  if (!message) return 0;
  return new TextEncoder().encode(message).length;
}
