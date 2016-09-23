/**
 * A dependency injection helper for the FTL resolver.
 *
 * The `Environment` class is a monad representing a computation which can read
 * and write values into a shared environment.  It's modeled after the RWS
 * (Reader, Writer, State) monad and it is good for passing and returning
 * implicit configuration information through a computation.
 *
 * Because of the mutable nature of JavaScript and for performance reasons,
 * `Environment` is implemented similar to the Reader monad.  It's sufficient
 * to read from it in order to be able to read and write values.
 *
 * See http://adit.io/posts/2013-06-10-three-useful-monads.html for a good
 * explanation of the Reader monad.
 *
 * You can use `Environment` to avoid having to pass too many arguments to each
 * function and to transparently handle return values.  Instead of:
 *
 *     function Entity(ctx, args, errors, dirty, entity) {
 *       return Value(ctx, args, errors, dirty, entity.val);
 *     }
 *
 *     function format(ctx, args, errors, entity) {
 *       return Entity(ctx, args, errors, new WeakSet(), entity);
 *     }
 *
 * …you can now do:
 *
 *     function* Entity(entity) {
 *       return yield* Value(entity.val);
 *     }
 *
 *     function format(ctx, args, entity, errors) {
 *       const env = { ctx, args, log: errors, dirty: new WeakSet() };
 *       return resolve(Entity(entity)).run(env);
 *     }
 *
 * @private
 */
class Environment {
  constructor(fn) {
    this.fn = fn;
  }

  run(env) {
    return this.fn(env);
  }

  flatMap(fn) {
    return new Environment(env => {
      const cur = this.run(env);
      return fn(cur).run(env);
    });
  }
}

export function ask() {
  return new Environment(env => env);
}

export function tell(msg) {
  return new Environment(env => {
    env.log.push(msg);
    return null;
  });
}

export function unit(val) {
  return new Environment(() => val);
}

export function resolve(iter) {
  return function step(resume) {
    const i = iter.next(resume);
    const rw = (i.value instanceof Environment) ?
      i.value : unit(i.value);
    return i.done ? rw : rw.flatMap(step);
  }();
}
