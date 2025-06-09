import { expect, test } from "vitest";
import { DequeAdd, DequeBase, DequeChange, DequeRemove } from "./index"
import { mixed, mixin } from "loudo-mixin";
import { Loud, Sized, Stash } from "loudo-ds-core";

test("DequeBase", () => {
  class C {}
  mixin(C, [DequeBase])
  const c = new C()
  expect(mixed(c, DequeBase)).toBe(true)
  expect(mixed(c, Sized)).toBe(true)
  expect(mixed(c, Stash)).toBe(true)
})

test("DequeAdd", () => {
  class C {}
  mixin(C, [DequeAdd])
  const c = new C()
  expect(mixed(c, DequeAdd)).toBe(true)
  expect(mixed(c, DequeBase)).toBe(true)
  expect(mixed(c, Sized)).toBe(true)
  expect(mixed(c, Stash)).toBe(true)
  expect(mixed(c, Loud)).toBe(true)
})

test("DequeRemove", () => {
  class C {}
  mixin(C, [DequeRemove])
  const c = new C()
  expect(mixed(c, DequeRemove)).toBe(true)
  expect(mixed(c, DequeBase)).toBe(true)
  expect(mixed(c, Sized)).toBe(true)
  expect(mixed(c, Stash)).toBe(true)
  expect(mixed(c, Loud)).toBe(true)
})

test("DequeChange", () => {
  class C {}
  mixin(C, [DequeChange])
  const c = new C()
  expect(mixed(c, DequeChange)).toBe(true)
  expect(mixed(c, DequeAdd)).toBe(true)
  expect(mixed(c, DequeRemove)).toBe(true)
  expect(mixed(c, DequeBase)).toBe(true)
  expect(mixed(c, Sized)).toBe(true)
  expect(mixed(c, Stash)).toBe(true)
  expect(mixed(c, Loud)).toBe(true)
})