import crypto from 'crypto'

// Use AES-256-GCM for encryption
const ALGORITHM = 'aes-256-gcm'
const KEY_LENGTH = 32
const IV_LENGTH = 16
const AUTH_TAG_LENGTH = 16

// Get encryption key from environment variable
// In production, this should be a secure random key stored in env vars
function getEncryptionKey(): Buffer {
  const key = process.env.BOOKING_ENCRYPTION_KEY

  if (!key) {
    throw new Error('BOOKING_ENCRYPTION_KEY environment variable is not set')
  }

  // Ensure key is exactly 32 bytes
  if (key.length < KEY_LENGTH) {
    throw new Error(`Encryption key must be at least ${KEY_LENGTH} characters`)
  }

  return Buffer.from(key.slice(0, KEY_LENGTH), 'utf-8')
}

export interface BookingReference {
  bookingNumber: string
  token: string
}

/**
 * Encrypt booking number and token into a single URL-safe reference
 */
export function encryptBookingReference(data: BookingReference): string {
  try {
    const key = getEncryptionKey()
    const iv = crypto.randomBytes(IV_LENGTH)

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

    // Combine booking number and token with a delimiter
    const plaintext = `${data.bookingNumber}|${data.token}`

    let encrypted = cipher.update(plaintext, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    const authTag = cipher.getAuthTag()

    // Combine IV + encrypted data + auth tag
    const combined = Buffer.concat([
      iv,
      Buffer.from(encrypted, 'hex'),
      authTag
    ])

    // Return as URL-safe base64
    return combined.toString('base64url')
  } catch (error) {
    console.error('Encryption error:', error)
    throw new Error('Failed to encrypt booking reference')
  }
}

/**
 * Decrypt booking reference back to booking number and token
 */
export function decryptBookingReference(encryptedRef: string): BookingReference | null {
  try {
    const key = getEncryptionKey()

    // Decode from URL-safe base64
    const combined = Buffer.from(encryptedRef, 'base64url')

    // Extract IV, encrypted data, and auth tag
    const iv = combined.subarray(0, IV_LENGTH)
    const authTag = combined.subarray(-AUTH_TAG_LENGTH)
    const encrypted = combined.subarray(IV_LENGTH, -AUTH_TAG_LENGTH)

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)

    let decrypted = decipher.update(encrypted, undefined, 'utf8')
    decrypted += decipher.final('utf8')

    // Split back into booking number and token
    const [bookingNumber, token] = decrypted.split('|')

    if (!bookingNumber || !token) {
      return null
    }

    return { bookingNumber, token }
  } catch (error) {
    console.error('Decryption error:', error)
    return null
  }
}

/**
 * Generate a secure encryption key (run this once to create your key)
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(KEY_LENGTH).toString('hex')
}
