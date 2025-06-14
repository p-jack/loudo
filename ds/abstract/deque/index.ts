import { Loud, Sized } from "loudo-ds-core"
import { mixin } from "loudo-mixin"

export abstract class DequeBase<T extends {}> {
  abstract get last():T|undefined
  abstract reversed():Sized<T>
}
export interface DequeBase<T extends {}> extends Sized<T> {}
mixin(DequeBase, [Sized])


export abstract class DequeAdd<T extends {}> {
  abstract push(value:T):void
  abstract unshift(value:T):void
}
export interface DequeAdd<T extends {}> extends DequeBase<T>, Loud<T> {}
mixin(DequeAdd, [DequeBase, Loud])


export abstract class DequeRemove<T extends {}> {
  abstract clear():void
  abstract pop():T|undefined
  abstract shift():T|undefined
  abstract drop(f:(x:T)=>boolean):number
}
export interface DequeRemove<T extends {}> extends DequeBase<T>, Loud<T> {}
mixin(DequeRemove, [DequeBase, Loud])


export abstract class DequeChange<T extends {}> {
  abstract replace(i:Iterable<T>):void
}
export interface DequeChange<T extends {}> extends DequeAdd<T>, DequeRemove<T> {}
mixin(DequeChange, [DequeAdd, DequeRemove])
