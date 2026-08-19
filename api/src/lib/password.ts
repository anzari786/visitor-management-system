import bcrypt from 'bcrypt';
import { randomBytes } from 'node:crypto';

export const PASSWORD_SALT_ROUNDS = 12;

const TEMP_PASSWORD_ALPHABET =
   'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';

export const hashPassword = (plain: string): Promise<string> =>
   bcrypt.hash(plain, PASSWORD_SALT_ROUNDS);

export const verifyPassword = (
   plain: string,
   passwordHash: string,
): Promise<boolean> => bcrypt.compare(plain, passwordHash);

/** One-time password shown to an admin after reset — never stored in plaintext. */
export const generateTempPassword = (length = 12): string => {
   const bytes = randomBytes(length);
   let password = '';

   for (let i = 0; i < length; i += 1) {
      password += TEMP_PASSWORD_ALPHABET[bytes[i] % TEMP_PASSWORD_ALPHABET.length];
   }

   return password;
};
