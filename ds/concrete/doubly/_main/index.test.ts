import { beforeEach, expect, test } from "vitest";
import { Doubly } from "./index";
import { capture } from "loudo-ds-tools-capture";

let d = new Doubly(["A"])
let c = capture(d)
let r = d.reversed()
let e = d.toEmpty()

beforeEach(() => {
  d = new Doubly(["A", "B", "C"])
  r = d.reversed()
  c = capture(d)
  e = d.toEmpty()
})

test("add", () => {
  d.add("D")
  expect([...d]).toStrictEqual(["A", "B", "C", "D"])
  expect([...r]).toStrictEqual(["D", "C", "B", "A"])
  expect(d.size).toBe(4)
  expect(c.get()).toStrictEqual({added:{elements:["D"], at:3}})
  e.push("X")
  expect(e.size).toBe(1)
  expect([...e]).toStrictEqual(["X"])
})

test("clear", () => {
  d.clear()
  expect([...d]).toStrictEqual([])
  expect([...r]).toStrictEqual([])
  expect(d.size).toBe(0)
  expect(c.get()).toStrictEqual({cleared:3})
})

test("drop", () => {
  const d = Doubly.of(1, 2, 3, 4, 5, 6, 7, 8, 9, 10)
  expect(d.drop(x => x === 100)).toBe(0)
  expect(d.drop(x => x % 2 === 1)).toBe(5)
  expect([...d]).toStrictEqual([2, 4, 6, 8, 10])
  expect([...d.reversed()]).toStrictEqual([10, 8, 6, 4, 2])
  expect(d.drop(x => x === 10)).toBe(1)
  expect([...d]).toStrictEqual([2, 4, 6, 8])
  expect([...d.reversed()]).toStrictEqual([8, 6, 4, 2])
  expect(d.drop(x => x === 2)).toBe(1)
  expect([...d]).toStrictEqual([4, 6, 8])
  expect([...d.reversed()]).toStrictEqual([8, 6, 4])
  expect(d.drop(() => true)).toBe(3)
  expect([...d]).toStrictEqual([])
  expect([...d.reversed()]).toStrictEqual([])
})

test("first", () => {
  expect(d.first).toBe("A")
  expect(e.first).toBeUndefined()
})

test("iterator", () => {
  expect([...d]).toStrictEqual(["A", "B", "C"])
  expect([...e]).toStrictEqual([])
})

test("last", () => {
  expect(d.last).toBe("C")
  expect(e.last).toBeUndefined()
})

test("of", () => {
  const d = Doubly.of("1", "2", "3")
  expect([...d]).toStrictEqual(["1", "2", "3"])
})

test("only", () => {
  expect(() => d.only).toThrowError()
  expect(() => e.only).toThrowError()
  e.push("Z")
  expect(e.only).toBe("Z")
})

test("pop", () => {
  expect(d.pop()).toBe("C")
  expect(d.size).toBe(2)
  expect([...d]).toStrictEqual(["A", "B"])
  expect([...r]).toStrictEqual(["B", "A"])
  expect(c.get()).toStrictEqual({removed:{elements:["C"], at:2}})
  expect(d.pop()).toBe("B")
  expect(d.size).toBe(1)
  expect([...d]).toStrictEqual(["A"])
  expect([...r]).toStrictEqual(["A"])
  expect(c.get()).toStrictEqual({removed:{elements:["B"], at:1}})
  expect(d.pop()).toBe(("A"))
  expect([...d]).toStrictEqual([])
  expect([...r]).toStrictEqual([])
  expect(d.size).toBe(0)
  expect(c.get()).toStrictEqual({removed:{elements:["A"], at:0}})
  expect(d.pop()).toBeUndefined()
})

test("push", () => {
  d.push("D")
  expect([...d]).toStrictEqual(["A", "B", "C", "D"])
  expect([...r]).toStrictEqual(["D", "C", "B", "A"])
  expect(d.size).toBe(4)
  expect(c.get()).toStrictEqual({added:{elements:["D"], at:3}})
  e.push("X")
  expect(e.size).toBe(1)
  expect([...e]).toStrictEqual(["X"])
})

test("replace", () => {
  d.replace([])
  expect(c.get()).toStrictEqual({cleared:3})
  d.replace([])
  expect(c.get()).toBeUndefined()
  d.replace(["1", "2", "3"])
  expect(c.get()).toStrictEqual({added:{elements:["1", "2", "3"], at:0}})
  d.replace(["A", "B", "C"])
  expect(c.get()).toStrictEqual({cleared:3, added:{elements:["A", "B", "C"], at:0}})
})

test("reversed", () => {
  expect([...r]).toStrictEqual(["C", "B", "A"])
  expect([...r]).toStrictEqual(["C", "B", "A"])
  expect(r.size).toBe(3)
})

test("shift", () => {
  expect(d.shift()).toBe("A")
  expect([...d]).toStrictEqual(["B", "C"])
  expect([...r]).toStrictEqual(["C", "B"])
  expect(d.size).toBe(2)
  expect(r.size).toBe(2)
  expect(c.get()).toStrictEqual({removed:{elements:["A"], at:0}})
  expect(d.shift()).toBe("B")
  expect([...d]).toStrictEqual(["C"])
  expect([...r]).toStrictEqual(["C"])
  expect(d.size).toBe(1)
  expect(r.size).toBe(1)
  expect(c.get()).toStrictEqual({removed:{elements:["B"], at:0}})
  expect(d.shift()).toBe("C")
  expect([...d]).toStrictEqual([])
  expect([...r]).toStrictEqual([])
  expect(d.size).toBe(0)
  expect(r.size).toBe(0)
  expect(c.get()).toStrictEqual({removed:{elements:["C"], at:0}})
  expect(d.shift()).toBeUndefined()
})

test("size", () => {
  expect(d.size).toBe(3)
  expect(e.size).toBe(0)
})

test("unshift", () => {
  d.unshift("0")
  expect([...d]).toStrictEqual(["0", "A", "B", "C"])
  expect([...r]).toStrictEqual(["C", "B", "A", "0"])
  expect(d.size).toBe(4)
  expect(c.get()).toStrictEqual({added:{elements:["0"], at:0}})
  e.unshift("a")
  expect([...e]).toStrictEqual(["a"])
  expect(e.size).toBe(1)
})
