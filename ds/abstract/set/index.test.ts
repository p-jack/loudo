import { mixin } from "loudo-mixin";
import { BaseSet, SetAdd } from "./index.js";
import { beforeEach, expect, test } from "vitest";

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
interface Test extends BaseSet<number>, SetAdd<number> {}
mixin(Test, [SetAdd])

let set = new Test(new Set([11, 22, 33]))
beforeEach(() => {
  set = new Test(new Set([11, 22, 33]))
})

test("addAll", () => {
  expect(set.addAll([33, 44, 55])).toBe(2)
  expect([...set]).toStrictEqual([11, 22, 33, 44, 55])
})