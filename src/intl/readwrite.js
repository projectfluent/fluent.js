class ReadWrite {
  constructor(fn) {
    this.fn = fn;
  }

  run(ctx) {
    return this.fn(ctx);
  }

  flatMap(fn) {
    return new ReadWrite(ctx => {
      const cur = this.run(ctx);
      return fn(cur).run(ctx);
    });
  }
}

export function ask() {
  return new ReadWrite(ctx => ctx);
}

export function tell(log) {
  return new ReadWrite(ctx => {
    ctx.errors.push(log);
    return null;
  });
}

export function unit(val) {
  return new ReadWrite(() => val);
}

export function resolve(iter) {
  return function step(resume) {
    const i = iter.next(resume);
    const rw = (i.value instanceof ReadWrite) ?
      i.value : unit(i.value);
    return i.done ? rw : rw.flatMap(step);
  }();
}
