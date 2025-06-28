import { beforeEach, describe, expect, test } from "vitest"
import { NIndex } from "./index"
import { capture } from "loudo-ds-tools-capture"

const elements = [1, 2, 3]

const conf = {index:(n:number)=>String(n)}

let ni = new NIndex([], conf)
let c = capture(ni)

beforeEach(() => {
  ni = new NIndex(elements, conf)
  c = capture(ni)
  expect(c.get()).toStrictEqual({added:{elements, at:0} })
})

describe("add", () => {
  test("new pair", () => {
    expect(ni.add(4)).toBe(true)
    expect(ni.size).toBe(4)
    expect([...ni]).toStrictEqual([1, 2, 3, 4])
    expect(c.get()).toStrictEqual({
      added:{elements:[4]},
    })
  })
  test("existing pair", () => {
    interface X { x:number, y:number }
    const conf = { index:(x:X) => x.x }
    const ni = new NIndex([{x:1, y:11}, {x:2, y:22}, {x:3, y:33}], conf)
    const c = capture(ni)
    expect(ni.add({x:1, y:111})).toBe(true)
    expect(ni.size).toBe(3)
    expect([...ni]).toStrictEqual([{x:1, y:111}, {x:2, y:22}, {x:3, y:33}])
    expect(c.get()).toStrictEqual({
      removed:{elements:[{x:1,y:11}]},
      added:{elements:[{x:1,y:111}]},
    })
  })
  test("same value", () => {
    expect(ni.add(1)).toBe(false)
    expect(ni.size).toBe(3)
    expect([...ni]).toStrictEqual([1, 2, 3])
    expect(c.get()).toBeUndefined()
  })
})

describe("addAll", () => {
  test("non-empty", () => {
    ni.addAll([4, 1])
    expect(c.get()).toStrictEqual({added:{elements:[4]}})
  })
  test("empty", () => {
    ni.clear()
    ni.addAll(elements)
    expect(c.get()).toStrictEqual({added:{elements, at:0}})
  })
})

describe("clear", () => {
  test("empty", () => {
    ni = new NIndex([], conf)
    c = capture(ni)
    ni.clear()
    expect(ni.size).toBe(0)
    expect([...ni]).toStrictEqual([])
    expect(c.get()).toBeUndefined()
  })
  test("non-empty", () => {
    ni.clear()
    expect(ni.size).toBe(0)
    expect([...ni]).toStrictEqual([])
    expect(c.get()).toStrictEqual({cleared:3})
  })
})

test("drop", () => {
  ni.drop(x => x === 2)
  expect(ni.size).toBe(2)
  expect([...ni]).toStrictEqual([1, 3])
  expect(c.get()).toStrictEqual({removed:{elements:[2]}})
})

test("get", () => {
  expect(ni.get("1")).toBe(1)
  expect(ni.get("2")).toBe(2)
  expect(ni.get("3")).toBe(3)
  expect(ni.get("4")).toBeUndefined()
})

test("iterator", () => {
  expect([...ni]).toStrictEqual(elements)
  expect([...ni]).toStrictEqual(elements)
})

describe("removeKey", () => {
  test("extant key", () => {
    expect(ni.removeKey("1")).toBe(1)
    expect(ni.size).toBe(2)
    expect([...ni]).toStrictEqual([2, 3])
    expect(c.get()).toStrictEqual({removed:{elements:[1]}})
  })
  test("non-extant key", () => {
    expect(ni.removeKey("4")).toBeUndefined()
    expect(ni.size).toBe(3)
    expect([...ni]).toStrictEqual(elements)
    expect(c.get()).toBeUndefined()
  })
})

describe("replace", () => {
  const n = [100, 200]
  test("empty with empty", () => {
    ni.clear()
    c.get()
    ni.replace([])
    expect(c.get()).toBeUndefined()
  })
  test("empty with non-empty", () => {
    ni.clear()
    ni.replace(n)
    expect(c.get()).toStrictEqual({added:{elements:n, at:0}})
  })
  test("non-empty with empty", () => {
    ni.replace([])
    expect(c.get()).toStrictEqual({cleared:3})
  })
  test("non-empty with non-empty", () => {
    ni.replace(n)
    expect(c.get()).toStrictEqual({
      cleared:3,
      added:{elements:n, at:0}
    })
  })
})

test("size", () => {
  expect(ni.size).toBe(3)
})

test("toEmpty", () => {
  const empty = ni.toEmpty()
  expect(empty.index === ni.index).toBe(true)
  expect(empty.size).toBe(0)
  expect([...empty]).toStrictEqual([])
})