import { OnlyError, Parsable, Sized, sized } from "loudo-ds-core";
import { mixin } from "loudo-mixin";
import { One } from "loudo-ds-one";
import { DequeChange } from "loudo-ds-deque-interfaces";


interface Node<T extends {}> {
  value: T
  next?: Node<T>
  prev?: Node<T>
}

const first = Symbol("first")
const last = Symbol("last")
const size = Symbol("size")
const conf = Symbol("conf")
const reversed = Symbol("reversed")

export interface Conf<T extends {}> {
  eq:(a:T,b:T)=>boolean
}

export class Doubly<T extends {}> {

  protected [first]:Node<T>|undefined
  protected [last]:Node<T>|undefined
  protected [size]:number
  protected [conf]:Conf<T>

  constructor(elements:Iterable<T>, config:Conf<T> = { eq:Object.is }) {
    this[size] = 0
    this[conf] = config
    for (const x of elements) this.push(x)
  }

  static of<T extends {}>(...elements:T[]) {
    return new Doubly(elements)
  }

  static from<T extends {}>(elements:Iterable<T>, c:Conf<T>) {
    return new Doubly(elements, c)
  }

  get size() { return this[size] }
  get eq() { return this[conf].eq }
  get first() { return this[first]?.value }
  get last() { return this[last]?.value }
  get only() {
    if (this.size !== 1) throw new OnlyError()
    return (this[first] as Node<T>).value
  }

  *[Symbol.iterator]() {
    for (let n = this[first]; n !== undefined; n = n.next) yield n.value
  }

  private *[reversed]() {
    for (let n = this[last]; n !== undefined; n = n.prev) yield n.value
  }

  reversed() {
    const me = this
    return sized(() => me[reversed](), () => me.size, me.eq)
  }

  protected rawAdd(value:T) {
    const n:Node<T> = { value }
    const sz = this[size]
    const l = this[last]
    if (l === undefined) {
      this[last] = n
      this[first] = n
    } else {
      l.next = n
      n.prev = l
      this[last] = n
    }
    this[size]++
  }

  add(value:T) {
    this.push(value)
  }

  push(value:T) {
    const sz = this[size]
    this.rawAdd(value)
    this.fire({added:{elements:One.of(value), at:sz }})
  }

  pop() {
    const l = this[last]
    if (l === undefined) return undefined
    if (l.prev === undefined) this[first] = undefined
    else l.prev.next = undefined
    this[last] = l.prev
    this[size]--
    const sz = this[size]
    this.fire({removed:{elements:One.of(l.value), at:sz }})
    return l.value
  }

  protected rawUnshift(value:T) {
    const n:Node<T> = { value }
    const f = this[first]
    if (f === undefined) {
      this[first] = n
      this[last] = n
    } else {
      n.next = f
      f.prev = n
      this[first] = n
    }
    this[size]++
  }

  unshift(value:T) {
    this.rawUnshift(value)
    this.fire({added:{elements:One.of(value), at:0}})
  }

  shift() {
    const f = this[first]
    if (f === undefined) return undefined
    if (f.next === undefined) this[last] = undefined
    else f.next.prev = undefined
    this[first] = f.next
    this[size]--
    this.fire({removed:{elements:One.of(f.value), at:0}})
    return f.value
  }

  clear() {
    const cleared = this[size]
    this[first] = undefined
    this[last] = undefined
    this[size] = 0
    this.fire({cleared})
  }

  drop(f:(x:T)=>boolean):number {
    let r = 0
    for (let n = this[first]; n !== undefined; n = n.next) {
      if (!f(n.value)) continue
      this[size]--
      r++
      if (n.prev === undefined) {
        this[first] = n.next
        if (n.next === undefined) this[last] = undefined
        else n.next.prev = undefined
      } else {
        n.prev.next = n.next
        if (n.next === undefined) this[last] = n.prev
        else n.next.prev = n.prev
      }
    }
    return r
  }

  replace(i:Iterable<T>) {
    const cleared = this[size]
    this[first] = undefined
    this[last] = undefined
    this[size] = 0
    let c = 0
    for (const x of i) {
      this.rawAdd(x)
      c++
    }
    if (c === 0) {
      if (cleared === 0) return
      this.fire({cleared})
      return
    }
    const elements = sized(() => i[Symbol.iterator](), () => c, this.eq)
    const added = { elements, at:0 }
    if (cleared > 0) this.fire({cleared:cleared, added})
    else this.fire({added})
  }

  toEmpty():Doubly<T> { return new Doubly<T>([], this[conf]) }

}
export interface Doubly<T> extends DequeChange<T>, Parsable<T> {}
mixin(Doubly, [Parsable])