import {
  encryptCredential,
  decryptCredential,
} from './MexcCredentialsCrypto.js';

export class MexcCredentialsService {
  constructor(repository) {
    this.repository = repository;
  }

  save({ apiKey, secretKey }) {
    if (!apiKey || !secretKey) {
      throw new Error('MEXC API key and secret key are required');
    }

    return this.repository.save({
      apiKeyEncrypted: encryptCredential(apiKey),
      secretKeyEncrypted: encryptCredential(secretKey),
    });
  }

  get() {
    const record = this.repository.get();

    if (!record) {
      return null;
    }

    return {
      apiKey: decryptCredential(record.api_key_encrypted),
      secretKey: decryptCredential(record.secret_key_encrypted),
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    };
  }

  getMasked() {
    const credentials = this.get();

    if (!credentials) {
      return null;
    }

    return {
      apiKey: mask(credentials.apiKey),
      hasSecretKey: credentials.secretKey.length > 0,
      createdAt: credentials.createdAt,
      updatedAt: credentials.updatedAt,
    };
  }

  delete() {
    return this.repository.delete();
  }
}

function mask(value) {
  if (value.length <= 8) {
    return '********';
  }

  return `${value.slice(0, 4)}${'*'.repeat(Math.max(4, value.length - 8))}${value.slice(-4)}`;
}
