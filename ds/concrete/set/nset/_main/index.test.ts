import { beforeEach, expect, test } from "vitest"
import { NSet } from "./index"
import { capture } from "loudo-ds-tools-capture"

let n = NSet.of("A", "B", "C")
let c = capture(n)
beforeEach(() => {
  n = NSet.from(["A", "B", "C"])
  c = capture(n)
  c.get()
})
test("add", () => {
  expect(n.add("A")).toBe(false)
  expect(c.get()).toBeUndefined()
  expect(n.add("D")).toBe(true)
  expect(c.get()).toStrictEqual({ added:{ elements:["D"] }})
  expect(n.has("D")).toBe(true)
  expect(n.size).toBe(4)
})
test("clear", () => {
  expect(n.clear()).toBe(3)
  expect(n.size).toBe(0)
  expect([...n]).toStrictEqual([])
  expect(c.get()).toStrictEqual({ cleared:3 })
})
test("drop", () => {
  const n = NSet.from(new Set([1, 2, 3, 4, 5, 6, 7, 8, 9]))
  expect(n.drop(x => x % 2 === 0)).toBe(4)
  expect(n.size).toBe(5)
  expect([...n]).toStrictEqual([1, 3, 5, 7, 9])
})
test("fromJSON", () => {
  expect(() => { NSet.fromJSON(true) }).toThrowError()
  expect(() => { NSet.fromJSON(3) }).toThrowError()
  expect(() => { NSet.fromJSON("3") }).toThrowError()
  expect(() => { NSet.fromJSON(null) }).toThrowError()
  expect([...NSet.fromJSON([1, 2, 3])]).toStrictEqual([1, 2, 3])
})
test("has", () => {
  expect(n.has("")).toBe(false)
  expect(n.has("A")).toBe(true)
  expect(n.has("B")).toBe(true)
  expect(n.has("C")).toBe(true)
  expect(n.has("D")).toBe(false)
})
test("iterator", () => {
  expect([...n]).toStrictEqual(["A", "B", "C"])
})
test("remove", () => {
  expect(n.remove("Z")).toBe(false)
  expect(c.get()).toBeUndefined()
  expect(n.remove("B")).toBe(true)
  expect(c.get()).toStrictEqual({removed:{ elements:["B"] }})
  expect(n.size).toBe(2)
  expect([...n]).toStrictEqual(["A", "C"])
})
test("replace", () => {
  n.replace(["1", "2", "3", "4"])
  expect([...n]).toStrictEqual(["1", "2", "3", "4"])
  expect(c.get()).toStrictEqual({
    cleared:3,
    added:{elements:["1", "2", "3", "4"]}
  })
  n.clear()
  c.get()
  n.replace(["AA", "BB"])
  expect([...n]).toStrictEqual(["AA", "BB"])
  expect(c.get()).toStrictEqual({added:{elements:["AA", "BB"]}})
})
test("size", () => {
  expect(n.size).toBe(3)
})
test("toEmpty", () => {
  const e = n.toEmpty()
  expect(e.size).toBe(0)
  expect([...e]).toStrictEqual([])
})
