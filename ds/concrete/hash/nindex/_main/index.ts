import { One } from "loudo-ds-one"
import { mixin } from "loudo-mixin"
import { IndexRemove } from "loudo-ds-index-interfaces"
import { SetAdd, SetChange } from "loudo-ds-set-interfaces"
import { Parsable } from "loudo-ds-core"

// TODO: Parsable!

const map = Symbol("map")

export interface Conf<K extends {},V extends {}> {
  index:(v:V)=>K
}

export class NIndex<K extends {},V extends {}> {

  private [map] = new Map<K,V>()
  protected conf:Conf<K,V>

  constructor(i:Iterable<V>, c:Conf<K,V>) {
    this.conf = c
    this.addAll(i)
  }

  toEmpty() { return new NIndex([], this.conf) }

  get size() { return this[map].size }
  get index() { return this.conf.index }

  [Symbol.iterator]() { return this[map].values() }

  get(k:K) { return this[map].get(k) }

  add(v:V) {
    const k = this.index(v)
    const old = this[map].get(k)
    this[map].set(k, v)
    if (old !== undefined && old === v) return false
    console.log({added:v, removed:old, eq:old === v})
    const added = {elements:One.of(v), at:-1}
    if (old === undefined) this.fire({added})
    else this.fire({removed:{elements:One.of(old), at:-1}, added})
    return true
  }

  addAll(i:Iterable<V>) {
    const index = this.index
    const sz = this.size
    if (sz === 0) {
      for (const x of i) this[map].set(index(x), x)
      this.fire({added:{elements:this, at:0}})
      return this.size
    }
    let c = 0
    for (const x of i) if (this.add(x)) c++
    return c
  }

  replace(i:Iterable<V>) {
    const index = this.index
    const sz = this.size
    this[map].clear()
    for (const x of i) this[map].set(index(x), x)
    if (this[map].size === 0) {
      if (sz > 0) this.fire({cleared:sz})
      return
    }
    this.fire({cleared:sz, added:{elements:this, at:0}})
  }

  removeKey(key:K) {
    const value = this[map].get(key)
    if (value === undefined) return
    this[map].delete(key)
    this.fire({removed:{at:-1, elements:One.of(value)}})
    return value
  }

  clear() {
    const sz = this.size
    if (sz === 0) return
    this[map].clear()
    this.fire({cleared:sz})
  }

  drop(f:(v:V)=>boolean) {
    const index = this.index
    for (const x of this) {
      if (f(x)) this.removeKey(index(x))
    }
  }

}
export interface NIndex<K extends {},V extends {}> extends IndexRemove<K,V>, SetAdd<V>, SetChange<V>, Parsable<V> {}
mixin(NIndex, [IndexRemove, SetAdd])
