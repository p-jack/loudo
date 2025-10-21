import { Weakness } from "weakness"
import { mixed, mixin } from "loudo-mixin"

const heard = Symbol("heard")
export interface Heard {
  readonly [heard]:number
}

export interface Mod<T extends {}> {
  elements: Sized<T>
  at: number
}

export interface LEvent<T extends {}> {
  readonly cleared?:number
  readonly added?:Mod<T>
  readonly removed?:Mod<T>
}

export type Ear<T extends {}> = (event:LEvent<T>)=>void

export class OnlyError extends Error {}

export interface Include {
  start: boolean
  end: boolean
}

export const IN_IN = { start:true, end:true }
export const IN_EX = { start:true, end:false }
export const EX_IN = { start:false, end:true }
export const EX_EX = { start:false, end:false }

const map = Symbol("map")
const filter = Symbol("filter")

function sizeFor<T>(i:Iterable<T>) {
  if (mixed(i, Sized)) return i.size
  const n = (i as any).length as number
  if (Number.isSafeInteger(n) && n >= 0) return n
  return
}

export abstract class Stash<T extends {}> {

  abstract [Symbol.iterator]():Iterator<T>

  get eq():(v1:T,v2:T)=>boolean { return Object.is }

  get first() {
    for (const x of this) return x;
    return undefined
  }

  get only():T {
    let r:T|undefined = undefined
    for (const x of this) {
      if (r !== undefined) throw new OnlyError()
      r = x
    }
    if (r === undefined) throw new OnlyError()
    return r
  }

  has(v:T) {
    const c = this.eq
    for (const x of this) if (c(x, v)) return true
    return false
  }

  find(f:(v:T)=>boolean) {
    for (const x of this) if (f(x)) return x
    return undefined
  }

  all(f:(v:T)=>boolean) {
    let c = 0
    for (const x of this) {
      c++
      if (!f(x)) return false
    }
    return c === 0 ? false : true
  }

  any(f:(v:T)=>boolean) {
    return this.find(f) !== undefined
  }

  forEach(f:(v:T)=>void) {
    for (const x of this) f(x)
  }

  private *[map]<R>(f:(x:T)=>R) {
    for (const x of this) yield f(x)
  }

  map<R extends {}>(f:(x:T)=>R, eq?:(a:R,b:R)=>boolean):Stash<R> {
    const me = this
    eq = eq ?? Object.is
    return stash(() => me[map](f), eq)
  }

  private *[filter](f:(x:T)=>boolean|"stop") {
    for (const x of this) {
      const r = f(x)
      if (r) yield x
    }
  }

  filter(f:(x:T)=>boolean):Stash<T> {
    const me = this
    const eq = (a:T,b:T) => me.eq(a,b)
    return stash(() => me[filter](f), eq)
  }

  reduce<A>(a:A, f:(a:A, x:T)=>A) {
    for (const x of this) a = f(a, x)
    return a
  }

  sameSeq(a:Iterable<T>) {
    if (a === this) return true
    const eq = this.eq
    const sz1 = sizeFor(this)
    const sz2 = sizeFor(a)
    if (sz1 !== undefined && sz2 !== undefined && sz1 !== sz2) return false
    let i1 = this[Symbol.iterator]()
    let i2 = a[Symbol.iterator]()
    while (true) {
      const r1 = i1.next()
      const r2 = i2.next()
      if (r1.done && r2.done) return true
      if (r1.done || r2.done) return false
      if (!eq(r1.value, r2.value)) return false
    }
  }

  toJSON() {
    return [...this]
  }

  toString() {
    return JSON.stringify(this)
  }
  
}

const size = Symbol("size")
const eq = Symbol("eq")
const gen = Symbol("gen")

class StashWrap<T extends {}> {

  [eq]:(a:T,b:T)=>boolean
  [gen]:()=>Iterator<T>

  constructor(iterable:()=>Iterator<T>, equals:(a:T,b:T)=>boolean) {
    this[eq] = equals
    this[gen] = iterable
  }

  get eq():(v1:T,v2:T)=>boolean { return this[eq] }
  [Symbol.iterator]() { return this[gen]() }

}
interface StashWrap<T extends {}> extends Stash<T> {}
mixin(StashWrap, [Stash])

export function stash<T extends {}>(gen:Iterable<T>|(()=>Iterator<T>), eq:(a:T,b:T)=>boolean = Object.is):Stash<T> {
  const g:()=>Iterator<T> = typeof(gen) === "function" ? gen : () => gen[Symbol.iterator]()
  return new StashWrap(g, eq)
}

export abstract class Sized<T extends {}> {
  abstract get size():number
  get empty() { return this.size === 0 }

  map<R extends {}>(f:(x:T)=>R, eq?:(a:R,b:R)=>boolean):Sized<R> {
    const me = this
    return sized(() => me[map](f), () => me.size, eq ?? Object.is)
  }

}
export interface Sized<T extends {}> extends Stash<T> {}
mixin(Sized, [Stash])

class SizedWrap<T extends {}> {

  [eq]:(a:T,b:T)=>boolean
  [size]:()=>number
  [gen]:()=>Iterator<T>

  constructor(iterable:()=>Iterator<T>, equals:(a:T,b:T)=>boolean, getSize:()=>number) {
    this[eq] = equals
    this[size] = getSize
    this[gen] = iterable
  }

  get size():number { return this[size]() }
  get eq():(v1:T,v2:T)=>boolean { return this[eq] }
  [Symbol.iterator]() { return this[gen]() }

}
interface SizedWrap<T extends {}> extends Sized<T> {}
mixin(SizedWrap, [Sized])

export function sized<T extends {}>(gen:Iterable<T>|(()=>Iterator<T>), size:()=>number, eq:(a:T,b:T)=>boolean = Object.is):Sized<T> {
  const g:()=>Iterator<T> = typeof(gen) === "function" ? gen : () => gen[Symbol.iterator]()
  return new SizedWrap(g, eq, size)
}

const ears = Symbol("ears")

export abstract class Loud<T extends {}> {

  private [ears]:Weakness<Ear<T>>|undefined

  hear(keeper:object, ear:Ear<T>):Heard {
    if (this[ears] === undefined) this[ears] = new Weakness()
    const r = { [heard]:this[ears].add(keeper, ear) }
    if (this.empty) ear({cleared:0})
    else ear({ added:{ elements:this, at:0 }})
    return r
  }

  unhear(h:Heard) {
    if (this[ears] === undefined) return
    return this[ears].delete(h[heard])
  }

  /* v8 ignore next 6 */
  protected fire(event:LEvent<T>) {
    const set = this[ears]
    if (set === undefined) return
    for (const x of set) { x(event) }
    return
  }

}
export interface Loud<T> extends Sized<T> {}
mixin(Loud, [Sized])


export abstract class Parsable<T extends {}> {
  abstract toEmpty():Parsable<T>
  abstract add(v:T, ...args:any):any
}
export interface Parsable<T extends {}> extends Loud<T> {}
mixin(Parsable, [Loud])
