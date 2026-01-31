export type PropGetters<TObj extends Record<string, any>> = {
  [TKey in string & keyof TObj as `get${Capitalize<TKey>}`]: () => TObj[TKey];
};
export class HelperService {
  protected u8: typeof Uint8Array = Uint8Array;
  protected te: TextEncoder;
  protected et = new this.u8(0);
  protected td: TextDecoder;
  constructor() {
    this.te = new TextEncoder();
    this.td = new TextDecoder();
  }

  public createGetterObject<const TObj extends Record<string, any> = object>(
    obj: TObj
  ): PropGetters<TObj> {
    const newObj: Record<string, any> = {};
    for (const key of Object.keys(obj)) {
      const capitalizedKey = key[0]
        ?.slice(0, 1)
        .toUpperCase()
        .concat(key[0]?.slice(1));
      const getterKey = `get${capitalizedKey}`;
      // extends Record<string, any> added to resolve obj[key] type error
      // eslint-disable-next-line
      newObj[getterKey] = () => obj[key];
    }
    return newObj as PropGetters<TObj>;
  }
  protected slc(v: Uint8Array, s: number, e?: number) {
    if (s == null || s < 0) s = 0;
    if (e == null || e > v.length) e = v.length;
    // can't use .constructor in case user-supplied
    return new this.u8(v.subarray(s, e));
  }

  protected strToU8(str: string, latin1 = false) {
    if (latin1) {
      const ar = new this.u8(str.length);
      for (let i = 0; i < str.length; ++i) ar[i] = str.charCodeAt(i);
      return ar;
    }
    if (this.te) return this.te.encode(str);
    const l = str.length;
    let ar = new this.u8(str.length + (str.length >> 1));
    let ai = 0;
    const w = (v: number) => {
      ar[ai++] = v;
    };
    for (let i = 0; i < l; ++i) {
      if (ai + 5 > ar.length) {
        const n = new this.u8(ai + 8 + ((l - i) << 1));
        n.set(ar);
        ar = n;
      }
      let c = str.charCodeAt(i);
      if (c < 128 || latin1) w(c);
      else if (c < 2048) (w(192 | (c >> 6)), w(128 | (c & 63)));
      else if (c > 55295 && c < 57344)
        ((c = (65536 + (c & (1023 << 10))) | (str.charCodeAt(++i) & 1023)),
          w(240 | (c >> 18)),
          w(128 | ((c >> 12) & 63)),
          w(128 | ((c >> 6) & 63)),
          w(128 | (c & 63)));
      else (w(224 | (c >> 12)), w(128 | ((c >> 6) & 63)), w(128 | (c & 63)));
    }
    return this.slc(ar, 0, ai);
  }

  protected strFromU8(dat: Uint8Array, latin1 = false) {
    if (latin1) {
      let r = "";
      for (let i = 0; i < dat.length; i += 16384)
        r += String.fromCharCode(...dat.subarray(i, i + 16384));
      return r;
    } else {
      return this.td.decode(dat);
    }
  }
}
