import { Loud, OnlyError, Sized, sized } from "loudo-ds-core"
import { mixin, mixed } from "loudo-mixin"

export class BoundsError extends Error {}

const reversed = Symbol("reversed")
const slice = Symbol("slice")

export abstract class ArrayBase<T extends {}> {

  at(i:number):T {
    this.bounds(i)
    return this.raw(i)
  }

  protected abstract raw(i:number):T

  *[Symbol.iterator]():Iterator<T> {
    for (let i = 0; i < this.size; i++) {
      yield this.raw(i)
    }
  }

  protected bounds(i:number, extra = false) {
    if (i < 0) throw new BoundsError("negative array index: " + i)
    if (!Number.isSafeInteger(i)) throw new BoundsError("invalid array index: " + i)
    const size = this.size
    if (extra) {
      if (i > size) throw new BoundsError(`index ${i} > size ${size}`)
    } else if (i >= size) throw new BoundsError(`index ${i} >= size ${size}`)
  }

  get first() { return this.size > 0 ? this.raw(0) : undefined }
  get last() { return this.size > 0 ? this.raw(this.size - 1) : undefined }
  get only() {
    if (this.size !== 1) throw new OnlyError()
    return this.raw(0)
  }

  equals(a:Iterable<T>) {
    const { size, eq } = this
    if (mixed(a, Sized) && a.size !== size) return false
    if ("length" in a && a.length !== size) return false
    let i = 0
    for (const x of a) {
      if (i >= size) return false
      if (!eq(x, this.raw(i))) return false
      i++
    }
    return i === size
  }

  findIndex(f:(x:T)=>boolean, from = 0):number|undefined {
    for (let i = from; i < this.size; i++) {
      if (f(this.raw(i))) return i
    }
    return undefined
  }

  findLastIndex(f:(x:T)=>boolean, from?:number):number|undefined {
    from = from ?? this.size - 1
    for (let i = from; i >= 0; i--) {
      if (f(this.raw(i))) return i
    }
    return undefined
  }

  private *[reversed]() {
    for (let i = this.size - 1; i >= 0; i--) yield this.raw(i)
  }

  reversed() {
    const me = this
    return sized(() => me[reversed](), () => this.size, this.eq)
  }

  private *[slice](start:number, end:number) {
    for (let i = start; i < end; i++) yield(this.raw(i))
  }

  slice(start:number, end?:number) {
    end = end ?? this.size
    this.bounds(start)
    this.bounds(end, true)
    if (end < start) throw new BoundsError(`start ${start} > end ${end}`)
    const me = this
    return sized(() => me[slice](start, end), () => end - start, this.eq)
  }
}
export interface ArrayBase<T extends {}> extends Sized<T> {}
mixin(ArrayBase, [Sized])


export abstract class ArrayRemove<T extends {}> {

  abstract removeAt(i:number):T
  abstract clear():void

  drop(f:(x:T,i:number)=>boolean):void {
    let i = 0, max = this.size
    for (let j = 0; j < max; j++) {
      const x = this.raw(i)
      if (f(x,j)) this.removeAt(i)
      else i++
    }
  }

}
export interface ArrayRemove<T extends {}> extends ArrayBase<T>, Loud<T> {}
mixin(ArrayRemove, [ArrayBase, Loud])


export abstract class ArrayChange<T extends {}> {
  abstract set(i:number, v:T):void
  abstract replace(i:Iterable<T>):void
  reverse() {
    for (let i = 0; i < this.size / 2; i++) {
      const temp = this.raw(i)
      const r = this.size - i - 1
      this.set(i, this.raw(r))
      this.set(r, temp)
    }
    this.fire({cleared:this.size, added:{ elements:this, at:0 }})
  }
}
export interface ArrayChange<T extends {}> extends ArrayBase<T>, Loud<T> {}
mixin(ArrayChange, [ArrayBase, Loud])

export abstract class ArrayAdd<T extends {}> {

  abstract add(v:T, i?:number):void

  addAll(v:Iterable<T>, i?:number) {
    i = i ?? this.size
    for (const x of v) {
      this.add(x, i)
      i++
    }
  }
}
export interface ArrayAdd<T extends {}> extends ArrayBase<T>, Loud<T> {}
mixin(ArrayAdd, [ArrayBase, Loud])
