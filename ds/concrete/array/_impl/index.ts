import { ArrayAdd, ArrayRemove, ArrayChange } from "loudo-ds-array-interfaces"
import { OnlyError, Parsable, sized } from "loudo-ds-core"
import { mixin } from "loudo-mixin"
import { One } from "loudo-ds-one"

export const a = Symbol("a")
export const conf = Symbol("conf")

export interface Conf<T> {
  readonly eq:(a:T,b:T)=>boolean
}

export class Ar<T extends {}> {

  protected readonly [a]:T[]
  protected readonly [conf]:Conf<T>

  constructor(array:Iterable<T>, config:Conf<T>) {
    this[a] = Array.isArray(array) ? array : [...array]
    this[conf] = config
  }

  static of<T extends {}>(...elements:T[]) {
    return new Ar(elements, { eq:Object.is })
  }

  static from<T extends {}>(elements:Iterable<T>, config:Conf<T> = { eq:Object.is }) {
    return new Ar(elements, config)
  }

  toEmpty() { return new Ar([], this[conf])}

  protected raw(i:number) { return this[a][i] as T }

  get size() { return this[a].length }
  [Symbol.iterator]() { return this[a][Symbol.iterator]() }
  get eq() { return this[conf].eq }
  get first() { return this[a][0] }
  get last() { return this[a][this[a].length - 1] }
  get only():T {
    if (this[a].length !== 1) throw new OnlyError()
    return this[a][0]!
  }

  removeAt(at:number):T {
    this.bounds(at)
    const r = this[a].splice(at, 1)[0]!
    this.fire({removed:{ elements:One.of(r), at }})
    return r
  }

  clear() {
    const l = this[a].length
    this[a].splice(0, l)
    this.fire({cleared:l})
  }

  set(at:number, v:T) {
    const old = this.at(at)
    this[a][at] = v
    if (this.eq(old, v)) return
    this.fire({
      removed: { elements:One.of(old), at },
      added: { elements:One.of(v), at },
    })
  }

  reverse() {
    this[a].reverse()
    this.fire({cleared:this[a].length, added:{elements:this, at:0}})
  }

  replace(i:Iterable<T>) {
    const l = this[a].length
    this[a].splice(0)
    for (const x of i) {
      this[a].push(x)
    }
    this.fire({cleared:l, added:{elements:this, at:0}})
  }
  
  add(v:T, at?:number) {
    at = at ?? this.size
    this.bounds(at, true)
    this[a].splice(at, 0, v)
    this.fire({added:{ elements:One.of(v), at }})
  }

  addAll(i:Iterable<T>, at?:number) {
    at = at ?? this.size
    this.bounds(at, true)
    let count = 0
    for (const x of i) {
      this[a].splice(at + count, 0, x)
      count++
    }
    const elements = sized(() => i[Symbol.iterator](), () => count, this.eq)
    this.fire({added:{ elements, at}})
  }

}
export interface Ar<T extends {}> extends ArrayAdd<T>, ArrayRemove<T>, ArrayChange<T> {}
mixin(Ar, [ArrayAdd, ArrayRemove, ArrayChange, Parsable])
