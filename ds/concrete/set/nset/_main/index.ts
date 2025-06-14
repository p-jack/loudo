import { SetBase, SetAdd, SetRemove } from "loudo-ds-set-interfaces";
import { mixin } from "loudo-mixin";
import { One } from "loudo-ds-one";
import { Parsable } from "loudo-ds-core";

const set = Symbol("set")
const conf = Symbol("conf")

export interface Conf {}

export class NSet<T extends {}> {

  private [set]:Set<T>
  protected readonly [conf]:Conf

  constructor(elements:Iterable<T>, config:Conf = {}) {
    this[conf] = config
    if (elements instanceof Set) this[set] = elements
    else this[set] = new Set(elements)
  }

  static of<T extends {}>(...elements:T[]) {
    return new NSet(elements)
  }

  static from<T extends {}>(elements:Iterable<T>, conf:Conf = {}) {
    return new NSet(elements, conf)
  }

  static fromJSON(json:any) {
    if (!Array.isArray(json)) throw new TypeError(`can't convert ${typeof json} to NSet`)
    return new NSet(json)
  }

  toEmpty() {
    return new NSet<T>([], this[conf])
  }

  get size() { return this[set].size }
  [Symbol.iterator]() { return this[set][Symbol.iterator]() }
  has(v:T):boolean { return this[set].has(v) }

  add(v: T):boolean {
    const s = this[set]
    if (s.has(v)) return false
    this[set].add(v)
    this.fire({ added:{elements:One.of(v), at:-1}})
    return true
  }

  remove(v:T):boolean {
    const s = this[set]
    if (!s.has(v)) return false
    s.delete(v)
    this.fire({ removed:{elements:One.of(v), at:-1} })
    return true
  }

  clear():number {
    const sz = this[set].size
    if (sz > 0) {
      this[set].clear()
      this.fire({ cleared:sz })  
    }
    return sz
  }

  replace(i:Iterable<T>) {
    const sz = this[set].size
    this[set].clear()
    for (const x of i) this[set].add(x)
    if (sz === 0) this.fire({added:{elements:this, at:-1}})
    else this.fire({cleared:sz, added:{elements:this, at:-1}})
  }

  drop(f:(v:T)=>boolean):number {
    const s = this[set]
    let c = 0
    for (const x of s) {
      if (f(x)) { s.delete(x); c++ }
    }
    return c
  }
}
export interface NSet<T extends {}> extends SetBase<T>, SetAdd<T>, SetRemove<T>, Parsable<T> {}
mixin(NSet, [SetBase, SetAdd, SetRemove])
