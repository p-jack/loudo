import { mixin } from "loudo-mixin"
import { Loud, Sized } from "loudo-ds-core"

export interface Pair<K extends {},V extends {}> {
  key: K
  value: V
}

export type Object<K extends {},V extends {}> = K extends string ? Record<string,V> : never
export type Pairs<K extends {},V extends {}> = Iterable<Pair<K,V>> | Iterable<[K,V]> | Object<K,V>

export abstract class MapBase<K extends {},V extends {}> {
  abstract get keyEq():(k1:K,k2:K)=>boolean
  abstract get valueEq():(v1:V,v2:V)=>boolean
  abstract get(key:K):V|undefined
  get eq() { return (e1:Pair<K,V>,e2:Pair<K,V>) => this.keyEq(e1.key, e2.key) && this.valueEq(e1.value, e2.value) }
  hasKey(key:K):boolean { return this.get(key) !== undefined }
  has(entry:Pair<K,V>) {
    const v = this.get(entry.key)
    if (v === undefined) return false
    return this.valueEq(entry.value, v)
  }
  get keys():Sized<K> { return this.map(x => x.key) }
  get values():Sized<V> { return this.map(x => x.value) }
}
export interface MapBase<K extends {},V extends {}> extends Sized<Pair<K,V>> {}
mixin(MapBase, [Sized])

export abstract class MapChange<K extends {},V extends {}> {
  abstract put(key:K, value:V):V|undefined
  abstract putAll(entries:Pairs<K,V>):void
  abstract replace(entries:Pairs<K,V>):void

}
export interface MapChange<K extends {},V extends {}> extends MapBase<K,V>, Loud<Pair<K,V>> {}
mixin(MapChange, [MapBase, Loud])

export abstract class MapRemove<K extends {},V extends {}> {
  abstract removeKey(key:K):V|undefined
  abstract clear():void
  abstract drop(f:(entry:Pair<K,V>)=>boolean):void
}
export interface MapRemove<K extends {},V extends {}> extends MapBase<K,V>, Loud<Pair<K,V>> {}
mixin(MapRemove, [MapBase, Loud])

export function forEach<K extends {},V extends {}>(input:Pairs<K,V>, f:(k:K, v:V)=>void):number {
  let count = 0
  if (Symbol.iterator in input) {
    for (const x of input) {
      count++
      if (Array.isArray(x)) f(x[0], x[1])
      else f(x.key, x.value)
    }
    return count
  }
  for (const [k, v] of Object.entries(input)) {
    count++
    f(k as never, v)
  }
  return count
}
