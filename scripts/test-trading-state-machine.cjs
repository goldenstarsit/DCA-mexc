const assert = require('node:assert/strict');

async function main() {
  const {
    TradingStateMachine,
    STATES,
  } = await import(
    '../src/server/tradingState/TradingStateMachine.js'
  );

  const machine =
    new TradingStateMachine();

  assert.equal(
    machine.getState(),
    STATES.STOPPED
  );

  console.log('Initial STOPPED state: OK');

  machine.transition(STATES.RUNNING);

  assert.equal(
    machine.getState(),
    STATES.RUNNING
  );

  console.log('STOPPED -> RUNNING: OK');

  machine.transition(STATES.ENTRY_PENDING);
  machine.transition(STATES.POSITION_OPEN);

  assert.equal(
    machine.getState(),
    STATES.POSITION_OPEN
  );

  console.log(
    'RUNNING -> ENTRY_PENDING -> POSITION_OPEN: OK'
  );

  machine.transition(STATES.DCA_PENDING);
  machine.transition(STATES.POSITION_OPEN);

  assert.equal(
    machine.getState(),
    STATES.POSITION_OPEN
  );

  console.log(
    'POSITION_OPEN -> DCA_PENDING -> POSITION_OPEN: OK'
  );

  machine.transition(STATES.EXIT_PENDING);
  machine.transition(STATES.STOPPED);

  assert.equal(
    machine.getState(),
    STATES.STOPPED
  );

  console.log(
    'POSITION_OPEN -> EXIT_PENDING -> STOPPED: OK'
  );

  const invalidMachine =
    new TradingStateMachine(
      STATES.RUNNING
    );

  assert.equal(
    invalidMachine.canTransition(
      STATES.POSITION_OPEN
    ),
    false
  );

  assert.throws(
    () =>
      invalidMachine.transition(
        STATES.POSITION_OPEN
      ),
    /Invalid trading state transition/
  );

  console.log('Invalid transition blocked: OK');

  assert.throws(
    () =>
      new TradingStateMachine('INVALID'),
    /Invalid trading state/
  );

  console.log('Invalid state validation: OK');

  const resetMachine =
    new TradingStateMachine(
      STATES.POSITION_OPEN
    );

  resetMachine.reset();

  assert.equal(
    resetMachine.getState(),
    STATES.STOPPED
  );

  console.log('State reset: OK');

  console.log('Milestone 24: OK');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
