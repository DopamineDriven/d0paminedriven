type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
  k: infer I
) => void
  ? I
  : never;
type NoUnion<Key> = [Key] extends [UnionToIntersection<Key>] ? Key : never;

type LocatorID<LocatorMapType> = keyof LocatorMapType & string;
type Constructor<T = any> = new (...args: any[]) => T;

export interface SymbolConstructor {
  readonly metadata: unique symbol;
}

class Locator<M> {
  constructor(private map: M) {}
  async get<ID extends LocatorID<M>>(id: NoUnion<ID>): Promise<M[ID]> {
    await new Promise(resolve => setTimeout(resolve, 100));
    return this.map[id];
  }
}

function getInstanceMeta(
  keyValuePromise: WeakMap<object, unknown>,
  instance: unknown
): Record<string | symbol, Promise<void>> {
  const thisKey = instance as object;
  const metaValue = keyValuePromise.get(thisKey) as Record<
    string | symbol,
    Promise<void>
  >;
  const meta = metaValue ?? {};
  if (!metaValue) {
    keyValuePromise.set(thisKey, meta);
  }
  return meta;
}

function locatorDecoratorFactory<LocatorMap>(locator: Locator<LocatorMap>) {
  return function <ID extends LocatorID<LocatorMap>>(id: NoUnion<ID>) {
    return function (
      _target: undefined,
      context: ClassFieldDecoratorContext<unknown, LocatorMap[ID] | undefined>
    ): void {
      // eslint-disable-next-line @typescript-eslint/unbound-method
      const { metadata, name, access, addInitializer } = context;

      addInitializer(function () {
        const instancesMap = (metadata.decoratorInjectionPromise ??=
          new WeakMap()) as WeakMap<object, unknown>;
        const meta = getInstanceMeta(instancesMap, this);
        let resolve: (value: void | PromiseLike<void>) => void;
        const promise = new Promise<void>(res => {
          resolve = res;
        });
        meta[name] = promise;

        locator.get(id as NoUnion<ID>).then((result: LocatorMap[ID]) => {
          access.set(this, result);
          resolve();
        });
      });
    };
  };
}

function injectable<T = unknown>() {
  return function (
    target: Constructor<T>,
    context: ClassDecoratorContext
  ): Constructor {
    return class extends (target as any) {
      readonly injected = Promise.all(
        Object.values(
          getInstanceMeta(
            context.metadata.decoratorInjectionPromise as WeakMap<
              object,
              unknown
            >,
            this
          )
        )
      );
    };
  };
}

abstract class InjectableDecorators {
  declare readonly injected: Promise<void>;
}

function waitUntilAllInjected<T = unknown>(target: T): Promise<void> {
  const injected = (target as InjectableDecorators).injected;
  return typeof (injected as Promise<void>)?.then === "function"
    ? injected
    : Promise.resolve();
}

class A {
  readonly id = "A";
}
class B {
  readonly id = "B";
}

interface LocatorMap {
  A: A;
  B: B;
}
const loc: Locator<LocatorMap> = new Locator<LocatorMap>({
  A: new A(),
  B: new B()
});
const injectProp = locatorDecoratorFactory(loc);

@injectable()
class T {
  @injectProp("A")
  private _a?: A;
  @injectProp("B")
  private _b?: B;
  json() {
    return { _a: this._a, _b: this._b };
  }
}

async function _main(): Promise<void> {
  const t1 = new T();
  console.log("Before", t1.json());
  await waitUntilAllInjected(t1);
  console.log("After", t1.json());
}
