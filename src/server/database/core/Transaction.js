export class Transaction {
  constructor(database) {
    this.database = database;
  }

  run(fn) {
    if (typeof fn !== 'function') {
      throw new TypeError('Transaction callback must be a function');
    }

    return this.database.transaction(fn);
  }
}
