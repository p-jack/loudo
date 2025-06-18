import { mixin, mixed } from "loudo-mixin";
import { SetBase, SetAdd, SetRemove, SetChange } from "./index.js";
import { beforeEach, describe, expect, test } from "vitest";
import { Loud, Sized, Stash } from "loudo-ds-core";

class Test {
  constructor(private set:Set<number>) {}
  get size(): number { return this.set.size }
  [Symbol.iterator]() { return this.set[Symbol.iterator]() }
  add(v:number) {
    if (this.set.has(v)) return false
    this.set.add(v)
    return true
  }
}
interface Test extends SetBase<number>, SetAdd<number> {}
mixin(Test, [SetAdd])

let set = new Test(new Set([11, 22, 33]))
beforeEach(() => {
  set = new Test(new Set([11, 22, 33]))
})

test("addAll", () => {
  expect(set.addAll([33, 44, 55])).toBe(2)
  expect([...set]).toStrictEqual([11, 22, 33, 44, 55])
})

describe("mixins", () => {
  test("SetBase", () => {
    class C {}
    interface C extends SetBase<number> {}
    mixin(C, [SetBase])
    const o = new C()
    expect(mixed(o, SetBase)).toBe(true)
    expect(mixed(o, Sized)).toBe(true)
    expect(mixed(o, Stash)).toBe(true)
  })
  test("SetAdd", () => {
    class C {}
    interface C extends SetAdd<number> {}
    mixin(C, [SetAdd])
    const o = new C()
    expect(mixed(o, SetAdd)).toBe(true)
    expect(mixed(o, Loud)).toBe(true)
    expect(mixed(o, SetBase)).toBe(true)
    expect(mixed(o, Sized)).toBe(true)
    expect(mixed(o, Stash)).toBe(true)
  })
  test("SetRemove", () => {
    class C {}
    interface C extends SetRemove<number> {}
    mixin(C, [SetRemove])
    const o = new C()
    expect(mixed(o, SetRemove)).toBe(true)
    expect(mixed(o, Loud)).toBe(true)
    expect(mixed(o, SetBase)).toBe(true)
    expect(mixed(o, Sized)).toBe(true)
    expect(mixed(o, Stash)).toBe(true)
  })
  test("SetChange", () => {
    class C {}
    interface C extends SetChange<number> {}
    mixin(C, [SetChange])
    const o = new C()
    expect(mixed(o, SetChange)).toBe(true)
    expect(mixed(o, Loud)).toBe(true)
    expect(mixed(o, SetBase)).toBe(true)
    expect(mixed(o, Sized)).toBe(true)
    expect(mixed(o, Stash)).toBe(true)
  })
})
