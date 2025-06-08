import { BaseSet, SetAdd, SetRemove } from "loudo-ds-set-interfaces";
import { mixin } from "loudo-mixin";
import { One } from "loudo-ds-one";

const set = Symbol("set")

export class NSet<T extends {}> {

  [set]:Set<T>

  constructor(elements:Iterable<T>) {
    if (elements instanceof Set) this[set] = elements
    else this[set] = new Set(elements)
  }

  static of<T extends {}>(...elements:T[]) {
    return new NSet(elements)
  }

  static from<T extends {}>(elements:Iterable<T>) {
    return new NSet(elements)
  }

  static fromJSON(json:any) {
    if (!Array.isArray(json)) throw new TypeError(`can't convert ${typeof json} to NSet`)
    return new NSet(json)
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
export interface NSet<T extends {}> extends BaseSet<T>, SetAdd<T>, SetRemove<T> {}
mixin(NSet, [BaseSet, SetAdd, SetRemove])
