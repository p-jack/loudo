import { Sized, Include, Stash, Loud } from "loudo-ds-core"
import { mixin } from "loudo-mixin"
import { Entry, MapBase, MapChange } from "loudo-ds-map-interfaces"

export abstract class MapsortBase<K extends {},V extends {}> {
  abstract get unique():boolean
  abstract get compare():(a:K,b:K)=>number
  abstract get last():Entry<K,V>|undefined
  abstract reversed():Sized<Entry<K,V>>
  abstract range(start:K, end:K, include?:Include):Stash<Entry<K,V>>
  abstract before(v:K):Entry<K,V>|undefined
  abstract after(v:K):Entry<K,V>|undefined
  abstract from(v:K):Entry<K,V>|undefined
  abstract to(v:K):Entry<K,V>|undefined
}
export interface MapsortBase<K extends {},V extends {}> extends MapBase<K,V> {}
mixin(MapsortBase, [MapBase])

export abstract class MapsortChange<K extends {},V extends {}> {
  abstract set compare(cmp:(a:K,b:K)=>number)
}
export interface MapsortChange<K extends {},V extends {}> extends MapsortBase<K,V>, MapChange<K,V> {}
mixin(MapsortChange, [MapsortBase, Loud])