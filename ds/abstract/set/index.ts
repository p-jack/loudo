import { Loud, Sized } from "loudo-ds-core";
import { mixin } from "loudo-mixin";

export abstract class SetBase<T extends {}> {}
export interface SetBase<T extends {}> extends Sized<T> {}
mixin(SetBase, [Sized])

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
export interface SetAdd<T extends {}> extends SetBase<T>, Loud<T> {}
mixin(SetAdd, [SetBase, Loud])

export abstract class SetRemove<T extends {}> {
  abstract remove(v:T):boolean
  abstract clear():number
  abstract drop(f:(v:T)=>boolean):number
}
export interface SetRemove<T extends {}> extends SetBase<T>, Loud<T> {}
mixin(SetRemove, [SetBase, Loud])

export abstract class SetChange<T extends {}> {
  abstract replace(i:Iterable<T>):void
}
export interface SetChange<T extends {}> extends SetBase<T>, Loud<T> {}
mixin(SetChange, [SetBase, Loud])