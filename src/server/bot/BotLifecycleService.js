import { publish } from '../realtime/EventBus.js';

const STATES = Object.freeze({
  STOPPED: 'STOPPED',
  RUNNING: 'RUNNING',
  PAUSED: 'PAUSED',
});

const TRANSITIONS = Object.freeze({
  STOPPED: ['RUNNING'],
  RUNNING: ['PAUSED', 'STOPPED'],
  PAUSED: ['RUNNING', 'STOPPED'],
});

export class BotLifecycleService {
  constructor(repository) {
    this.repository = repository;
  }

  getState() {
    return this.repository.get()?.state ?? STATES.STOPPED;
  }

  start() {
    return this.transition(
      STATES.RUNNING,
      'BOT_STARTED'
    );
  }

  pause() {
    return this.transition(
      STATES.PAUSED,
      'BOT_PAUSED'
    );
  }

  resume() {
    return this.transition(
      STATES.RUNNING,
      'BOT_RESUMED'
    );
  }

  stop() {
    return this.transition(
      STATES.STOPPED,
      'BOT_STOPPED'
    );
  }

  transition(nextState, reason) {
    const currentState = this.getState();

    if (
      !TRANSITIONS[currentState]?.includes(nextState)
    ) {
      throw new Error(
        `Invalid bot transition: ${currentState} -> ${nextState}`
      );
    }

    const record =
      this.repository.setState(nextState);

    const result = {
      previousState: currentState,
      currentState: nextState,
      reason,
      updatedAt: record.updated_at,
    };

    try {
      publish('BOT_STATE_CHANGED', {
        previousState: currentState,
        currentState: nextState,
        reason,
        updatedAt: record.updated_at,
      });
    } catch {
      // Realtime delivery must never break bot lifecycle changes.
    }

    return result;
  }
}

export {
  STATES as BOT_STATES,
  TRANSITIONS as BOT_TRANSITIONS,
};
