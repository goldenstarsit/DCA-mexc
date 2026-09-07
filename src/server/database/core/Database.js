export class Database {
  constructor(adapter) {
    this.adapter = adapter;
  }

  exec(sql) {
    return this.adapter.exec(sql);
  }

  prepare(sql) {
    return this.adapter.prepare(sql);
  }

  transaction(fn) {
    return this.adapter.transaction(fn)();
  }

  close() {
    return this.adapter.close();
  }
}
