import { mixin } from "loudo-mixin"
import { SetBase, SetChange } from "loudo-ds-set-interfaces"
import { Include, Sized, Stash } from "loudo-ds-core"

export abstract class SetsortBase<T extends {}> {
  abstract get compare():(a:T,b:T)=>number
  abstract get last():T|undefined
  abstract reversed():Sized<T>
  abstract range(start:T, end:T, include?:Include):Stash<T>
  abstract before(v:T):T|undefined
  abstract after(v:T):T|undefined
  abstract from(v:T):T|undefined
  abstract to(v:T):T|undefined
}
export interface SetsortBase<T extends {}> extends SetBase<T> {}
mixin(SetsortBase, [SetBase])


export abstract class SetsortChange<T extends {}> {
  abstract set compare(f:(a:T,b:T)=>number)
}
export interface SortsortChange<T extends {}> extends SetsortBase<T>, SetChange<T> {}
mixin(SetsortChange, [SetsortBase, SetChange])
