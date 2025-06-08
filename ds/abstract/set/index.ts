import { Loud, Sized } from "loudo-ds-core";
import { mixin } from "loudo-mixin";

export abstract class BaseSet<T extends {}> {}
export interface BaseSet<T extends {}> extends Sized<T> {}
mixin(BaseSet, [Sized])

export abstract class SetAdd<T extends {}> {
  abstract add(v:T):boolean
  addAll(v:Iterable<T>) {
    let c = 0
    for (const x of v) {
      if (this.add(x)) c++
    }
    return c
  }
}
export interface SetAdd<T extends {}> extends BaseSet<T>, Loud<T> {}
mixin(SetAdd, [BaseSet, Loud])

export abstract class SetRemove<T extends {}> {
  abstract remove(v:T):boolean
  abstract clear():number
  abstract drop(f:(v:T)=>boolean):number
}
export interface SetRemove<T extends {}> extends BaseSet<T>, Loud<T> {}
mixin(SetAdd, [BaseSet, Loud])
