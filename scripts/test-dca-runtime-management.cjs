const baseUrl = 'http://localhost:3000/api/dca/levels';

async function request(method, body) {
  const response = await fetch(baseUrl, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      `${method} failed: ${response.status} ${JSON.stringify(data)}`
    );
  }

  return data;
}

async function main() {
  const initial = await request('GET');

  if (!initial.success || !Array.isArray(initial.levels)) {
    throw new Error('GET DCA levels failed');
  }

  const testLevel =
    1000 + Math.floor(Math.random() * 9000);

  const created = await request('POST', {
    level: testLevel,
    triggerPercent: 50,
    quantity: 1,
    enabled: true,
  });

  if (
    !created.success ||
    created.level.level !== testLevel
  ) {
    throw new Error('Runtime DCA creation failed');
  }

  const updated = await request('PATCH', {
    level: testLevel,
    triggerPercent: 55,
    quantity: 2,
  });

  if (
    !updated.success ||
    Number(updated.level.trigger_percent) !== 55 ||
    Number(updated.level.quantity) !== 2
  ) {
    throw new Error('Runtime DCA update failed');
  }

  console.log('Runtime DCA GET: OK');
  console.log('Runtime DCA CREATE: OK');
  console.log('Runtime DCA UPDATE: OK');
  console.log('Milestone 14: OK');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
