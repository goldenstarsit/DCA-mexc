const STATES = Object.freeze({
  STOPPED: 'STOPPED',
  RUNNING: 'RUNNING',
  ENTRY_PENDING: 'ENTRY_PENDING',
  POSITION_OPEN: 'POSITION_OPEN',
  DCA_PENDING: 'DCA_PENDING',
  EXIT_PENDING: 'EXIT_PENDING',
});

const TRANSITIONS = Object.freeze({
  STOPPED: ['RUNNING'],
  RUNNING: ['STOPPED', 'ENTRY_PENDING'],
  ENTRY_PENDING: ['POSITION_OPEN', 'RUNNING', 'STOPPED'],
  POSITION_OPEN: [
    'DCA_PENDING',
    'EXIT_PENDING',
    'STOPPED',
  ],
  DCA_PENDING: [
    'POSITION_OPEN',
    'EXIT_PENDING',
    'STOPPED',
  ],
  EXIT_PENDING: [
    'STOPPED',
    'POSITION_OPEN',
  ],
});

export class TradingStateMachine {
  constructor(initialState = STATES.STOPPED) {
    this.validateState(initialState);
    this.state = initialState;
  }

  getState() {
    return this.state;
  }

  canTransition(nextState) {
    this.validateState(nextState);

    return TRANSITIONS[this.state].includes(
      nextState
    );
  }

  transition(nextState) {
    this.validateState(nextState);

    if (!this.canTransition(nextState)) {
      throw new Error(
        `Invalid trading state transition: ${this.state} -> ${nextState}`
      );
    }

    const previousState = this.state;
    this.state = nextState;

    return {
      previousState,
      currentState: this.state,
    };
  }

  reset() {
    this.state = STATES.STOPPED;

    return this.state;
  }

  validateState(state) {
    if (!Object.values(STATES).includes(state)) {
      throw new Error(
        `Invalid trading state: ${state}`
      );
    }
  }
}

export { STATES, TRANSITIONS };
