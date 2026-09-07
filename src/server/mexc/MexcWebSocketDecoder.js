import protobuf from 'protobufjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const protoPath = path.join(
  __dirname,
  'proto',
  'PublicAggreDealsV3Api.proto'
);

let wrapperTypePromise = null;

function getWrapperType() {
  if (!wrapperTypePromise) {
    wrapperTypePromise = protobuf
      .load(protoPath)
      .then(root => root.lookupType('PushDataV3ApiWrapper'));
  }

  return wrapperTypePromise;
}

async function toUint8Array(data) {
  if (data instanceof Uint8Array) {
    return data;
  }

  if (data instanceof ArrayBuffer) {
    return new Uint8Array(data);
  }

  if (typeof Blob !== 'undefined' && data instanceof Blob) {
    return new Uint8Array(await data.arrayBuffer());
  }

  if (data?.buffer instanceof ArrayBuffer) {
    return new Uint8Array(
      data.buffer,
      data.byteOffset || 0,
      data.byteLength
    );
  }

  throw new TypeError(
    `Unsupported MEXC WebSocket binary payload: ${
      data?.constructor?.name || typeof data
    }`
  );
}

export async function decodeMexcWebSocketMessage(data) {
  const bytes = await toUint8Array(data);

  const Wrapper = await getWrapperType();

  const decoded = Wrapper.decode(bytes);

  return Wrapper.toObject(decoded, {
    longs: Number,
    enums: Number,
    defaults: false,
    arrays: true,
    objects: true,
  });
}
