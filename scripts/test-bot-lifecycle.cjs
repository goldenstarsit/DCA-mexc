const assert = require('node:assert/strict');

async function main() {
  const {
    BotLifecycleService,
  } = await import(
    '../src/server/bot/BotLifecycleService.js'
  );

  let state = 'STOPPED';

  const repository = {
    get() {
      return {
        state,
        updated_at: new Date().toISOString(),
      };
    },

    setState(nextState) {
      state = nextState;

      return {
        state,
        updated_at: new Date().toISOString(),
      };
    },
  };

  const bot =
    new BotLifecycleService(repository);

  assert.equal(
    bot.getState(),
    'STOPPED'
  );

  console.log('Initial STOPPED state: OK');

  let result = bot.start();

  assert.equal(
    result.currentState,
    'RUNNING'
  );

  assert.equal(
    bot.getState(),
    'RUNNING'
  );

  console.log('Bot start: OK');

  result = bot.pause();

  assert.equal(
    result.currentState,
    'PAUSED'
  );

  console.log('Bot pause: OK');

  result = bot.resume();

  assert.equal(
    result.currentState,
    'RUNNING'
  );

  console.log('Bot resume: OK');

  result = bot.stop();

  assert.equal(
    result.currentState,
    'STOPPED'
  );

  console.log('Bot stop: OK');

  assert.throws(
    () => bot.pause(),
    /Invalid bot transition/
  );

  console.log('Invalid transition protection: OK');

  bot.start();

  assert.throws(
    () => bot.start(),
    /Invalid bot transition/
  );

  console.log('Duplicate start protection: OK');

  bot.stop();

  assert.equal(
    bot.getState(),
    'STOPPED'
  );

  console.log('Final state persistence: OK');

  console.log('Milestone 26: OK');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
