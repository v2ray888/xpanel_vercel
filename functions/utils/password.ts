// Password utility functions that work in both Node.js and Edge environments
let bcrypt: any;

// Try to import bcryptjs, fallback to Web Crypto API if not available
try {
  bcrypt = await import('bcryptjs');
} catch (error) {
  console.warn('bcryptjs not available, using Web Crypto API as fallback');
  bcrypt = null;
}

/**
 * Hash a password using bcrypt or Web Crypto API
 * @param password The plain text password to hash
 * @param saltRounds The number of salt rounds (default: 10)
 * @returns The hashed password
 */
export async function hashPassword(password: string, saltRounds: number = 10): Promise<string> {
  if (bcrypt && typeof bcrypt.hash === 'function') {
    // Use bcryptjs
    return await bcrypt.hash(password, saltRounds);
  } else {
    // Fallback to Web Crypto API
    throw new Error('Password hashing not implemented for Edge environment');
  }
}

/**
 * Compare a plain text password with a hashed password
 * @param password The plain text password
 * @param hash The hashed password
 * @returns True if the passwords match, false otherwise
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  if (bcrypt && typeof bcrypt.compare === 'function') {
    // Use bcryptjs
    return await bcrypt.compare(password, hash);
  } else {
    // Fallback to Web Crypto API
    throw new Error('Password comparison not implemented for Edge environment');
  }
}