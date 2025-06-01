import { test, expect, describe, beforeEach } from "vitest"
import { Ar } from "./index"
import { ArrayBase, ArrayChange, ArrayRemove, ArrayAdd } from "loudo-ds-array-interfaces"
import { Parsable, Sized, Stash } from "loudo-ds-core"
import { mixed } from "loudo-mixin"
import { capture } from "loudo-ds-tools-capture"

describe("Ar", () => {
  let a = Ar.of<string>()
  let c = capture(a)
  beforeEach(() => {
    a = Ar.of("A", "B", "C", "D")
    c = capture(a)
    c.get()
  })
  describe("add", () => {
    test("no index", () => {
      a.add("E")
      expect([...a]).toStrictEqual(["A", "B", "C", "D", "E"])
      expect(c.get()).toStrictEqual({added:{elements:["E"], at:4}})
    })
    test("with index", () => {
      a.add("Z", 0)
      expect([...a]).toStrictEqual(["Z", "A", "B", "C", "D"])
      expect(c.get()).toStrictEqual({added:{elements:["Z"], at:0}})
      expect(() => { a.add("Z", 100) }).toThrow("index 100 > size 5")
    })
  })
  describe("addAll", () => {
    test("no index", () => {
      a.addAll(new Set(["E", "F"]))
      expect([...a]).toStrictEqual(["A", "B", "C", "D", "E", "F"])
      expect(c.get()).toStrictEqual({added:{elements:["E", "F"], at:4}})
    })
    test("with index", () => {
      a.addAll(Ar.of("Z", "Y"), 0)
      expect([...a]).toStrictEqual(["Z", "Y", "A", "B", "C", "D"])
      expect(c.get()).toStrictEqual({added:{elements:["Z", "Y"], at:0}})
    })
  })
  test("at", () => {
    expect(a.at(0)).toBe("A")
    expect(a.at(1)).toBe("B")
    expect(a.at(2)).toBe("C")
    expect(a.at(3)).toBe("D")
  })
  test("clear", () => {
    a.clear()
    expect(a.size).toBe(0)
    expect(a.empty).toBe(true)
    expect(a.first).toBeUndefined()
    expect(a.last).toBeUndefined()
    expect(c.get()).toStrictEqual({cleared:4})
  })
  test("eq", () => {
    expect(a.eq === Object.is).toBe(true)
  })
  test("findIndex", () => {
    expect(a.findIndex(x => x === "C")).toBe(2)
    expect(a.findIndex(x => x === "Z")).toBeUndefined()
  })
  test("first", () => { expect(a.first).toBe("A") })
  test("from", () => {
    const eq = (a:string,b:string) => a.toLowerCase() === b.toLowerCase()
    const a2 = Ar.from(["A", "b", "C"], { eq })
    expect(a2.eq).toStrictEqual(eq)
    expect([...a2]).toStrictEqual(["A", "b", "C"])
  })
  test("iterator", () => { expect([...a]).toStrictEqual(["A", "B", "C", "D"]) })
  test("last", () => { expect(a.last).toBe("D") })
  test("mixins", () => {
    expect(mixed(a, ArrayBase)).toBe(true)
    expect(mixed(a, Sized)).toBe(true)
    expect(mixed(a, Stash)).toBe(true)
  })
  describe("only", () => {
    test("many", () => {
      expect(() => { a.only }).toThrowError()
    })
    test("zero", () => {
      expect(() => { Ar.of().only }).toThrowError()
    })
    test("one", () => {
      expect(Ar.of("one").only).toBe("one")
    })
  })
  test("mixins", () => {
    expect(mixed(a, ArrayBase)).toBe(true)
    expect(mixed(a, Sized)).toBe(true)
    expect(mixed(a, Stash)).toBe(true)
    expect(mixed(a, ArrayChange)).toBe(true)
    expect(mixed(a, ArrayRemove)).toBe(true)
    expect(mixed(a, ArrayAdd)).toBe(true)
    expect(mixed(a, Parsable)).toBe(true)
  })
  test("removeAt", () => {
    expect(() => { a.removeAt(-1) }).toThrow("negative array index: -1")
    a.removeAt(2)
    expect([...a]).toStrictEqual(["A", "B", "D"])
    expect(c.get()).toStrictEqual({removed:{elements:["C"], at:2}})
  })
  test("replace", () => {
    a.replace(["1", "2", "3"])
    expect([...a]).toStrictEqual(["1", "2", "3"])
    expect(c.get()).toStrictEqual({cleared:4, added:{elements:["1", "2", "3"], at:0}})
  })
  test("reverse", () => {
    a.reverse()
    expect([...a]).toStrictEqual(["D", "C", "B", "A"])
    expect(c.get()).toStrictEqual({cleared:4, added:{elements:["D", "C", "B", "A"], at:0}})
  })
  test("set", () => {
    a.set(1, "X")
    expect([...a]).toStrictEqual(["A", "X", "C", "D"])
    expect(c.get()).toStrictEqual({
      added:{elements:["X"], at:1},
      removed:{elements:["B"], at:1},
    })
    a.set(1, "X")
    expect(c.get()).toBeUndefined()
  })
  test("toEmpty", () => {
    expect([...a.toEmpty()]).toStrictEqual([])
  })
})

test("from", () => {
  const set = new Set(["A", "B", "C"])
  const a = Ar.from(set)
  expect(a.size).toBe(3)
  expect([...a]).toStrictEqual(["A", "B", "C"])
})

test("of", () => {
  const a = Ar.of("A", "B", "C")
  expect(a.size).toBe(3)
  expect([...a]).toStrictEqual(["A", "B", "C"])
})
