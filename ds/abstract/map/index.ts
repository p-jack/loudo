import { mixin } from "loudo-mixin"
import { Loud, Sized } from "loudo-ds-core"
import { One } from "loudo-ds-one"

export interface Entry<K extends {},V extends {}> {
  key: K
  value: V
}

export abstract class MapBase<K extends {},V extends {}> {
  abstract get keyEq():(k1:K,k2:K)=>boolean
  abstract get valueEq():(v1:V,v2:V)=>boolean
  abstract get(key:K):V|undefined
  get eq() { return (e1:Entry<K,V>,e2:Entry<K,V>) => this.keyEq(e1.key, e2.key) && this.valueEq(e1.value, e2.value) }
  hasKey(key:K):boolean { return this.get(key) !== undefined }
  has(entry:Entry<K,V>) {
    const v = this.get(entry.key)
    if (v === undefined) return false
    return this.valueEq(entry.value, v)
  }
  get keys():Sized<K> { return this.map(x => x.key) }
  get values():Sized<V> { return this.map(x => x.value) }
}
export interface MapBase<K extends {},V extends {}> extends Sized<Entry<K,V>> {}
mixin(MapBase, [Sized])

export abstract class MapChange<K extends {},V extends {}> {

  protected abstract rawPut(key:K, value:V):V|undefined

  put(key:K, value:V):V|undefined {
    const r = this.rawPut(key, value)
    if (r === undefined) {
      this.fire({added:{elements:One.of({key, value}), at:-1}})
      return
    }
    if (this.valueEq(r, value)) return
    else this.fire({
      removed:{elements:One.of({key, value:r}), at:-1},
      added:{elements:One.of({key, value}), at:-1}
    })
    return r
  }

  putAll(entries:MapInput<K,V>) {
    if (this.size === 0) {
      const c = forEach(entries, (k,v) => this.rawPut(k,v))
      if (c > 0) this.fire({added:{elements:this, at:-1}})
      return
    }
    forEach(entries, (k,v) => this.put(k,v))
  }

  abstract replace(entries:MapInput<K,V>):void

}
export interface MapChange<K extends {},V extends {}> extends MapBase<K,V>, Loud<Entry<K,V>> {}
mixin(MapChange, [MapBase, Loud])

export abstract class MapRemove<K extends {},V extends {}> {
  abstract removeKey(key:K):V|undefined
  abstract clear():void
  abstract drop(f:(entry:Entry<K,V>)=>boolean):void
}
export interface MapRemove<K extends {},V extends {}> extends MapBase<K,V>, Loud<Entry<K,V>> {}
mixin(MapRemove, [MapBase, Loud])

export type Object<K extends {},V extends {}> = K extends string ? Record<string,V> : never
export type MapInput<K extends {},V extends {}> = Iterable<Entry<K,V>> | Iterable<[K,V]> | Object<K,V>

export function forEach<K extends {},V extends {}>(input:MapInput<K,V>, f:(k:K, v:V)=>void):number {
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
