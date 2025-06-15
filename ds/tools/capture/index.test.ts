import { Loud } from "loudo-ds-core"
import { mixin } from "loudo-mixin"
import { expect, test } from "vitest"
import { capture } from "./index"

class Empty<T extends {}> {
  *[Symbol.iterator]():Iterator<T> { }
}
interface Empty<T extends {}> extends Loud<T> {}
mixin(Empty, [Loud])

class Foo<T extends {}> {
  constructor(private _value:T) {}
  *[Symbol.iterator]() { yield this._value }
  get value() { return this._value }
  set value(v:T) {
    const old = this._value
    this._value = v
    this.fire({
      removed:{ elements:new Foo(old), at:0 },
      added:{ elements:this, at:0 },
    })
  }
  clear() { 
    this.fire({ cleared: 1 })
  }
  bad() { this.fire({
    added:{ elements: new Empty<T>(), at:-1 },
  })}
  good() {
    this.fire({
      added:{ elements:this, at:-1 }
    })
  }
}
interface Foo<T extends {}> extends Loud<T> {}
mixin(Foo, [Loud])

test("capture", () => {
  const foo = new Foo("1")
  const c = capture(foo)
  expect(c.get()).toStrictEqual({
    added: { elements:["1"], at:0 },
  })
  expect(c.get()).toBeUndefined()
  foo.value = "2"
  expect(c.get()).toStrictEqual({
    removed: { elements:["1"], at:0 },
    added: { elements:["2"], at:0 },
  })
  expect(c.get()).toBeUndefined()
  foo.bad()
  expect(() => { c.get() }).toThrowError()
  expect(c.get()).toBeUndefined()
  foo.clear()
  expect(c.get()).toStrictEqual({ cleared: 1 })
  foo.good()
  expect(c.get()).toStrictEqual({added:{elements:["2"]}})
})

test("no index", () => {
  const foo = new Foo("1")
  const c = capture(foo)
  expect(c.get()).toStrictEqual({
    added: { at:0, elements:["1"] },
  })
})

test("entries", () => {
  const foo = new Foo({ key:"1", value:1, extra:"ignored" })
  const c = capture(foo)
  expect(c.get()).toStrictEqual({
    added: { elements:[{ key:"1", value:1 }], at:0 },
  })
})