import { mixin } from "loudo-mixin"
import { SetAdd, SetRemove } from "loudo-ds-set-interfaces"
import { Include, stash } from "loudo-ds-core"
import { SetsortChange } from "loudo-ds-setsort-interfaces"
import { IndexRemove } from "loudo-ds-index-interfaces"
import { TreeMap } from "loudo-ds-tree-map"

export interface Conf<K extends {},V extends {}> {
  index:(v:V)=>K
  compareKey:(a:K,b:K)=>number
}

const map = Symbol("map")
const conf = Symbol("conf")

export class TreeIndex<K extends {},V extends {}> {

  private readonly [map]:TreeMap<K,V>
  private readonly [conf]:Conf<K,V>

  constructor(i:Iterable<V>, c:Conf<K,V>) {
    this[conf] = c
    this[map] = new TreeMap<K,V>([], {
      compare: c.compareKey,
      unique: true,
      valueEq: Object.is,
    })
    this.addAll(i)
    this[map].hear(this, evt => {
      const removed = evt.removed ? {
        elements: evt.removed.elements.map(x => x.value),
        at: evt.removed.at,
      } : undefined
      const added = evt.added ? {
        elements: evt.added.elements.map(x => x.value),
        at: evt.added.at,
      } : undefined
      this.fire({ cleared:evt.cleared, removed, added })
    })
  }

  get index() { return this[conf].index }
  get compare():(v1:V,v2:V)=>number { return (v1:V,v2:V) => this[conf].compareKey(this.index(v1), this.index(v2)) }

  get first() { return this[map].first?.value }
  get last() { return this[map].last?.value }
  get only() { return this[map].only.value }
  get size() { return this[map].size }

  get(k:K) { return this[map].get(k) }
  from(v:V) { return this[map].from(this.index(v))?.value }
  to(v:V) { return this[map].to(this.index(v))?.value }
  before(v:V) { return this[map].before(this.index(v))?.value }
  after(v:V) { return this[map].after(this.index(v))?.value }

  *[Symbol.iterator]() { for (const v of this[map].values) yield v }
  reversed() { return this[map].reversed().map(x => x.value) }
  range(start:V, end:V, inc:Include) { return this[map].range(this.index(start), this.index(end), inc).map(x => x.value) }

  add(value:V) {
    const key = this.index(value)
    const m = this[map]
    if (m.has({key, value})) return false
    this[map].put(key, value)
    return true
  }

  addAll(i:Iterable<V>) {
    const s = stash(i, this.eq)
    const index = this.index
    return this[map].putAll(s.map(x => { return {key:index(x), value:x}}))
  }

  clear() {
    this[map].clear()
  }

  replace(i:Iterable<V>) {
    const s = stash(i, this.eq)
    const index = this.index
    this[map].replace(s.map(x => { return {key:index(x), value:x}}))
  }

  removeKey(k:K) {
    return this[map].removeKey(k)
  }

  drop(f:(v:V)=>boolean) {
    this[map].drop(pair => f(pair.value))
  }

}
export interface TreeIndex<K extends {},V extends {}>
extends SetsortChange<V>, IndexRemove<K,V>, SetAdd<V>, SetRemove<V> {}
mixin(TreeIndex, [SetsortChange, IndexRemove, SetAdd, SetRemove])