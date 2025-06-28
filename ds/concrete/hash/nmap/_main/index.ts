import { MapChange, MapRemove, Pair, Pairs, forEach } from "loudo-ds-map-interfaces"
import { One } from "loudo-ds-one"
import { mixin } from "loudo-mixin"
import { sized } from "loudo-ds-core"

const map = Symbol("map")

// @ts-ignore
export interface Conf<K extends {},V extends {}> {

}

export class NMap<K extends {},V extends {}> {

  private [map] = new Map<K,V>()
  protected conf:Conf<K,V>

  constructor(i:Pairs<K,V>, c:Conf<K,V> = {}) {
    this.putAll(i)
    this.conf = c
  }

  get size() { return this[map].size }
  get keyEq():(a:K,b:K)=>boolean { return Object.is }
  get valueEq():(a:V,b:V)=>boolean { return Object.is }

  *[Symbol.iterator]() {
    for (const x of this[map].entries()) yield { key:x[0], value:x[1] }
  }
  get keys() { return sized(() => this[map].keys(), () => this[map].size, this.keyEq)}
  get values() { return sized(() => this[map].values(), () => this[map].size, this.valueEq)}

  get(k:K) { return this[map].get(k) }

  put(key:K, value:V) {
    const old = this[map].get(key)
    this[map].set(key, value)
    if (old !== undefined && this.valueEq(old, value)) return old
    const added = {elements:One.of({key, value}), at:-1}
    if (old === undefined) this.fire({added})
    else {
      const removed = {elements:One.of({key,value:old}), at:-1}
      this.fire({removed, added})
    }
    return old
  }

  putAll(pairs:Pairs<K,V>) {
    if (this.empty) {
      forEach(pairs, (k,v) => this[map].set(k,v))
      this.fire({added:{elements:this, at:0}})
    } else forEach(pairs, (k,v) => this.put(k,v))
  }

  replace(pairs:Pairs<K,V>) {
    const sz = this.size
    this[map].clear()
    forEach(pairs, (k,v) => this[map].set(k,v))
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
    this.fire({removed:{at:-1, elements:One.of({key, value})}})
    return value
  }

  clear() {
    const sz = this.size
    if (sz === 0) return
    this[map].clear()
    this.fire({cleared:sz})
  }

  drop(f:(pair:Pair<K,V>)=>boolean) {
    for (const pair of this) {
      if (f(pair)) this.removeKey(pair.key)
    }
  }

}
export interface NMap<K extends {},V extends {}> extends MapChange<K,V>, MapRemove<K,V> {}
mixin(NMap, [MapChange, MapRemove])
