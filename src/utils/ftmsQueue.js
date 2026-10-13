// FTMS permits one procedure at a time. GATT write success is not device acceptance.
export class FtmsQueue {
  constructor(write, timeout = 3000) { this.write = write; this.timeout = timeout; this.queue = Promise.resolve(); this.pending = null; }
  send(buffer) {
    const run = () => new Promise((resolve, reject) => {
      const opcode = new Uint8Array(buffer)[0];
      const timer = setTimeout(() => finish(new Error('FTMS response timeout')), this.timeout);
      const finish = error => { clearTimeout(timer); this.pending = null; error ? reject(error) : resolve(true); };
      this.pending = { opcode, finish };
      Promise.resolve().then(() => this.write(buffer)).catch(finish);
    });
    const result = this.queue.then(run);
    this.queue = result.catch(() => {});
    return result;
  }
  receive(data) {
    if (data.byteLength < 3 || data.getUint8(0) !== 0x80 || data.getUint8(1) !== this.pending?.opcode) return;
    this.pending.finish(data.getUint8(2) === 1 ? null : new Error(`FTMS rejected command (${data.getUint8(2)})`));
  }
  disconnect() { this.pending?.finish(new Error('Trainer disconnected')); }
}
