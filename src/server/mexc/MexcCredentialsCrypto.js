import crypto from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32;

function getEncryptionKey() {
  const encoded = process.env.MEXC_CREDENTIALS_ENCRYPTION_KEY;

  if (!encoded) {
    throw new Error(
      'MEXC_CREDENTIALS_ENCRYPTION_KEY is not configured'
    );
  }

  let key;

  try {
    key = Buffer.from(encoded, 'base64');
  } catch {
    throw new Error(
      'MEXC_CREDENTIALS_ENCRYPTION_KEY must be valid base64'
    );
  }

  if (key.length !== KEY_LENGTH) {
    throw new Error(
      'MEXC_CREDENTIALS_ENCRYPTION_KEY must decode to 32 bytes'
    );
  }

  return key;
}

export function encryptCredential(value) {
  if (typeof value !== 'string' || value.length === 0) {
    throw new TypeError('Credential value must be a non-empty string');
  }

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const ciphertext = Buffer.concat([
    cipher.update(value, 'utf8'),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return [
    iv.toString('base64'),
    authTag.toString('base64'),
    ciphertext.toString('base64'),
  ].join('.');
}

export function decryptCredential(payload) {
  if (typeof payload !== 'string' || !payload.includes('.')) {
    throw new TypeError('Invalid encrypted credential');
  }

  const [ivEncoded, authTagEncoded, ciphertextEncoded] =
    payload.split('.');

  const iv = Buffer.from(ivEncoded, 'base64');
  const authTag = Buffer.from(authTagEncoded, 'base64');
  const ciphertext = Buffer.from(ciphertextEncoded, 'base64');

  if (
    iv.length !== IV_LENGTH ||
    authTag.length !== AUTH_TAG_LENGTH
  ) {
    throw new Error('Invalid encrypted credential format');
  }

  const key = getEncryptionKey();

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    key,
    iv
  );

  decipher.setAuthTag(authTag);

  const plaintext = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return plaintext.toString('utf8');
}
