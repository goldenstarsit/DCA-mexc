const assert = require('node:assert/strict');

async function main() {
  const { MexcClient } = await import(
    '../src/server/mexc/MexcClient.js'
  );

  let publicRequest = null;
  let signedRequest = null;

  const client = new MexcClient({
    apiKey: 'TEST_API_KEY',
    secretKey: 'TEST_SECRET',
    now: () => 1700000000000,

    fetchImpl: async (url, options) => {
      if (url.includes('/api/v3/time')) {
        publicRequest = {
          url,
          options,
        };

        return new Response(
          JSON.stringify({
            serverTime: 1700000000123,
          }),
          { status: 200 }
        );
      }

      if (url.includes('/api/v3/account')) {
        signedRequest = {
          url,
          options,
        };

        return new Response(
          JSON.stringify({
            accountType: 'SPOT',
            balances: [],
          }),
          { status: 200 }
        );
      }

      throw new Error(`Unexpected URL: ${url}`);
    },
  });

  const time = await client.serverTime();

  assert.equal(
    time.serverTime,
    1700000000123
  );

  assert.equal(
    publicRequest.options.headers['X-MEXC-APIKEY'],
    undefined
  );

  const account = await client.account();

  assert.equal(
    account.accountType,
    'SPOT'
  );

  assert.equal(
    signedRequest.options.headers['X-MEXC-APIKEY'],
    'TEST_API_KEY'
  );

  assert.match(
    signedRequest.url,
    /timestamp=1700000000000/
  );

  assert.match(
    signedRequest.url,
    /signature=[a-f0-9]{64}/
  );

  const signature =
    client.sign(
      'timestamp=1700000000000'
    );

  assert.equal(signature.length, 64);
  assert.match(signature, /^[a-f0-9]{64}$/);

  console.log('MEXC public API test: OK');
  console.log('MEXC signed API test: OK');
  console.log('HMAC-SHA256 signing: OK');
  console.log('API key header handling: OK');
  console.log('Timestamp/signature handling: OK');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
