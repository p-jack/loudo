import { test, expect, describe, beforeEach } from "vitest"
import { IndexBase, IndexRemove } from "./index"
import { mixin, mixed } from "loudo-mixin"
import { Loud, Sized, Stash } from "loudo-ds-core"
import { SetBase, SetRemove } from "loudo-ds-set-interfaces"

class Nums {
  private m = new Map<number,number>([[1,2], [2,4], [3,6]])
  get index() { return n => n / 2 }
  get(k:number) { return this.m.get(k) }
  removeKey(k:number) {
    const old = this.m.get(k)
    this.m.delete(k)
    return old
  }
}
interface Nums extends IndexRemove<number,number> {}
mixin(Nums, [IndexRemove])

test("has", () => {
  const i = new Nums()
  expect(i.has(2)).toBe(true)
  expect(i.has(4)).toBe(true)
  expect(i.has(6)).toBe(true)
  expect(i.has(10)).toBe(false)
})

test("hasKey", () => {
  const i = new Nums()
  expect(i.hasKey(1)).toBe(true)
  expect(i.hasKey(2)).toBe(true)
  expect(i.hasKey(3)).toBe(true)
  expect(i.has(5)).toBe(false)
})

test("removeKey", () => {
  const i = new Nums()
  expect(i.remove(2)).toBe(true)
  expect(i.has(2)).toBe(false)
  expect(i.has(4)).toBe(true)
  expect(i.has(6)).toBe(true)
})

describe("mixins", () => {
  test("IndexBase", () => {
    class C {}
    interface C extends IndexBase<number,number> {}
    mixin(C, [IndexBase])
    const o = new C()
    expect(mixed(o, IndexBase)).toBe(true)
    expect(mixed(o, SetBase)).toBe(true)
    expect(mixed(o, Sized)).toBe(true)
    expect(mixed(o, Stash)).toBe(true)
  })
  test("IndexRemove", () => {
    class C {}
    interface C extends IndexRemove<number,number> {}
    mixin(C, [IndexRemove])
    const o = new C()
    expect(mixed(o, IndexRemove)).toBe(true)
    expect(mixed(o, SetRemove)).toBe(true)
    expect(mixed(o, IndexBase)).toBe(true)
    expect(mixed(o, SetBase)).toBe(true)
    expect(mixed(o, Loud)).toBe(true)
    expect(mixed(o, Sized)).toBe(true)
    expect(mixed(o, Stash)).toBe(true)
  })
})
