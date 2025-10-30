// Password utility functions that work in both Node.js and Edge environments
import bcrypt from '@node-rs/bcrypt';

/**
 * Hash a password using bcrypt
 * @param password The plain text password to hash
 * @param saltRounds The number of salt rounds (default: 10)
 * @returns The hashed password
 */
export async function hashPassword(password: string, saltRounds: number = 10): Promise<string> {
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Compare a plain text password with a hashed password
 * @param password The plain text password
 * @param hash The hashed password
 * @returns True if the passwords match, false otherwise
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}