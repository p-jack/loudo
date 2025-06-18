import { test, expect, describe, beforeEach } from "vitest"
import { SetsortBase, SetsortChange } from "./index"
import { mixin, mixed } from "loudo-mixin"
import { Loud, Sized, Stash } from "loudo-ds-core"
import { SetBase, SetChange, SetRemove } from "loudo-ds-set-interfaces"

describe("mixins", () => {
  test("SetsortBase", () => {
    class C {}
    interface C extends SetsortBase<number> {}
    mixin(C, [SetsortBase])
    const o = new C()
    expect(mixed(o, SetsortBase)).toBe(true)
    expect(mixed(o, SetBase)).toBe(true)
    expect(mixed(o, Sized)).toBe(true)
    expect(mixed(o, Stash)).toBe(true)
  })
  test("IndexRemove", () => {
    class C {}
    interface C extends SetsortChange<number> {}
    mixin(C, [SetsortChange])
    const o = new C()
    expect(mixed(o, SetsortChange)).toBe(true)
    expect(mixed(o, SetChange)).toBe(true)
    expect(mixed(o, SetsortBase)).toBe(true)
    expect(mixed(o, SetBase)).toBe(true)
    expect(mixed(o, Loud)).toBe(true)
    expect(mixed(o, Sized)).toBe(true)
    expect(mixed(o, Stash)).toBe(true)
  })
})
