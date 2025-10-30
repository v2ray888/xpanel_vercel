// Password utility functions that work in both Node.js and Edge environments

/**
 * Hash a password using bcrypt or Web Crypto API
 * @param password The plain text password to hash
 * @param saltRounds The number of salt rounds (default: 10)
 * @returns The hashed password
 */
export async function hashPassword(password: string, saltRounds: number = 10): Promise<string> {
  try {
    // Dynamically import bcryptjs only when needed
    const bcrypt = await import('bcryptjs');
    return await bcrypt.hash(password, saltRounds);
  } catch (error) {
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
  try {
    // Dynamically import bcryptjs only when needed
    const bcrypt = await import('bcryptjs');
    return await bcrypt.compare(password, hash);
  } catch (error) {
    // Fallback to Web Crypto API
    throw new Error('Password comparison not implemented for Edge environment');
  }
}