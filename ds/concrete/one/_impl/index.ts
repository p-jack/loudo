import { Sized } from "loudo-ds-core"
import { mixin } from "loudo-mixin"

const value = Symbol("value")
const eq = Symbol("eq")

export class One<T extends {}> {

  protected [value]:T
  protected [eq]:(a:T,b:T)=>boolean

  private constructor(v:T, _eq:(a:T,b:T)=>boolean) {
    this[value] = v
    this[eq] = _eq
  }

  get size() { return 1 }
  get first() { return this[value] }
  get last() { return this[value] }
  get only() { return this[value] }
  get eq() { return this[eq] }
  *[Symbol.iterator]() { yield this[value] }

  static of<T extends {}>(v:T, eq:(a:T,b:T)=>boolean = Object.is) { return new One(v, eq) }

}
export interface One<T extends {}> extends Sized<T> {}
mixin(One, [Sized])
