import { test, expect, describe, beforeEach } from "vitest"
import { Loud, Sized, Stash } from "loudo-ds-core"
import { ArrayAdd, ArrayBase, ArrayRemove, ArrayChange } from "./index"
import { mixin, mixed } from "loudo-mixin"
import { capture } from "loudo-ds-tools-capture"

class R {
  constructor(public readonly count:number) {}
  get size() { return this.count }
  protected get config() { return {} }
  raw(i:number) { return (i + 1) * 11 }
}
interface R extends ArrayBase<number> {}
mixin(R, [ArrayBase])

function *gen() {
  for (let i = 11; i < 66; i += 11) yield i
}

describe("BaseArray", () => {
  let a = new R(4)
  beforeEach(() => {
    a = new R(4)
  })
  test("at", () => {
    expect(a.at(0)).toBe(11)
    expect(a.at(1)).toBe(22)
    expect(a.at(2)).toBe(33)
    expect(a.at(3)).toBe(44)
    expect(() => { a.at(-1) }).toThrow("negative array index: -1")
    expect(() => { a.at(0.5) }).toThrow("invalid array index: 0.5")
    expect(() => { a.at(4) }).toThrow("index 4 >= size 4")
  })
  test("equals", () => {
    expect(a.equals([11, 22, 33, 44])).toBe(true)
    expect(a.equals([11, 2, 33, 44])).toBe(false)
    expect(a.equals(new R(4))).toBe(true)
    expect(a.equals(new R(5))).toBe(false)
    expect(a.equals([])).toBe(false)
    expect(a.equals(gen())).toBe(false)
    expect(a.equals([11, 22, 33])).toBe(false)
  })
  test("findIndex", () => {
    expect(a.findIndex(x => x === 33)).toBe(2)
    expect(a.findIndex(x => x === 1111)).toBeUndefined()
  })
  test("findLastIndex", () => {
    expect(a.findLastIndex(x => x === 33)).toBe(2)
    expect(a.findLastIndex(x => x === 1111)).toBeUndefined()
  })
  test("first", () => {
    expect(a.first).toBe(11)
    expect(new R(0).first).toBeUndefined()
  })
  test("iterator", () => { expect([...a]).toStrictEqual([11, 22, 33, 44]) })
  test("last", () => {
    expect(a.last).toBe(44)
    expect(new R(0).last).toBeUndefined()
  })
  test("only", () => {
    expect(() => { a.only }).toThrowError()
    const a0 = new R(0)
    expect(() => { a0.only }).toThrowError()
    const a1 = new R(1)
    expect(a1.only).toBe(11)
  })
  test("reversed", () => {
    const r = a.reversed()
    expect([...r]).toStrictEqual([44, 33, 22, 11])
    expect([...r]).toStrictEqual([44, 33, 22, 11])
  })
  test("slice", () => {
    expect([...a.slice(0)]).toStrictEqual([11, 22, 33, 44])
    expect([...a.slice(1)]).toStrictEqual([22, 33, 44])
    expect([...a.slice(2, 3)]).toStrictEqual([33])
    expect([...a.slice(2, 2)]).toStrictEqual([])
    expect(() => { [...a.slice(-1)] }).toThrowError()
    expect(() => { [...a.slice(0, 5)] }).toThrowError()
    expect(() => { [...a.slice(2, 1)] }).toThrowError()
  })
})


class M {

  constructor(readonly a:string[]) {}

  get size(): number {
    return this.a.length
  }

  protected raw(i:number):string {
    return this.a[i]
  }
  
  set(i:number, v:string) {
    this.bounds(i)
    this.a[i] = v
  }

  removeAt(i:number) {
    this.bounds(i)
    return this.a.splice(i, 1)[0]
  }

  add(v:string, i?:number) {
    i = i ?? this.size
    this.bounds(i, true)
    this.a.splice(i, 0, v)
  }

  clear() {
    throw new Error("not needed for unit testing")
  }

}
interface M extends ArrayAdd<string>, ArrayRemove<string>, ArrayChange<string> {}
mixin(M, [ArrayBase, ArrayAdd, ArrayRemove, ArrayChange])

describe("ArrayRemove", () => {
  describe("drop", () => {
    describe("by value", () => {
      test("start", () => {
        const a = new M(["z1", "z2", "z3", "A", "B"])
        expect(a.drop(x => x.startsWith("z"))).toBe(3)
        expect([...a]).toStrictEqual(["A", "B"])
      })
      test("end", () => {
        const a = new M(["A", "B", "z1", "z2", "z3"])
        expect(a.drop(x => x.startsWith("z"))).toBe(3)
        expect([...a]).toStrictEqual(["A", "B"])
      })
      test("middle", () => {
        const a = new M(["A", "z1", "z2", "z3", "B"])
        expect(a.drop(x => x.startsWith("z"))).toBe(3)
        expect([...a]).toStrictEqual(["A", "B"])
      })
      test("all", () => {
        const a = new M(["z1", "A", "z2", "B", "z3"])
        expect(a.drop(x => x.startsWith("z"))).toBe(3)
        expect([...a]).toStrictEqual(["A", "B"])
      })
      test("clear", () => {
        const a = new M(["z1", "A", "z2", "B", "z3"])
        expect(a.drop(() => true)).toBe(5)
        expect([...a]).toStrictEqual([])
      })
    })
    describe("by index", () => {
      test("start", () => {
        const a = new M(["z1", "z2", "z3", "A", "B"])
        expect(a.drop((_,i) => i < 3)).toBe(3)
        expect([...a]).toStrictEqual(["A", "B"])
      })
      test("end", () => {
        const a = new M(["A", "B", "z1", "z2", "z3"])
        expect(a.drop((_,i) => i >= 2)).toBe(3)
        expect([...a]).toStrictEqual(["A", "B"])
      })
      test("middle", () => {
        const a = new M(["A", "z1", "z2", "z3", "B"])
        expect(a.drop((_,i) => i >= 1 && i <= 3)).toBe(3)
        expect([...a]).toStrictEqual(["A", "B"])
      })
      test("all", () => {
        const a = new M(["z1", "A", "z2", "B", "z3"])
        expect(a.drop((_,i) => i === 0 || i === 2 || i === 4)).toBe(3)
        expect([...a]).toStrictEqual(["A", "B"])
      })
      test("clear", () => {
        const a = new M(["z1", "A", "z2", "B", "z3"])
        expect(a.drop(() => true)).toBe(5)
        expect([...a]).toStrictEqual([])
      })
    })
  })
})

describe("ArrayChange", () => {
  test("reverse", () => {
    const m = new M(["A", "B", "C", "D"])
    const c = capture(m)
    c.get()
    m.reverse()
    expect([...m]).toStrictEqual(["D", "C", "B", "A"])
    expect(c.get()).toStrictEqual({
      cleared:4,
      added:{ at:0, elements:["D", "C", "B", "A"]}
    })
  })
})

describe("ArrayAdd", () => {
  describe("addAll", () => {
    test("no index", () => {
      const m = new M([])
      m.addAll(["A", "B", "C"])
      expect([...m]).toStrictEqual(["A", "B", "C"])
    })
    test("with index", () => {
      const m = new M(["A", "B", "C"])
      m.addAll(["a", "b", "c"], 1)
      expect([...m]).toStrictEqual(["A", "a", "b", "c", "B", "C"])
    })
    test("invalid index", () => {
      const m = new M(["A", "B", "C"])
      expect(() => { m.addAll(["a", "b", "c"], 4) }).toThrow("index 4 > size 3")
    })
  })
})

test("mixins", () => {
  const r = new R(4)
  expect(mixed(r, ArrayBase)).toBe(true)
  expect(mixed(r, Sized)).toBe(true)
  expect(mixed(r, Stash)).toBe(true)
  const m = new M(["11", "22"])
  expect(mixed(m, ArrayAdd)).toBe(true)
  expect(mixed(m, ArrayRemove)).toBe(true)
  expect(mixed(m, ArrayChange)).toBe(true)
  expect(mixed(m, ArrayBase)).toBe(true)
  expect(mixed(m, Sized)).toBe(true)
  expect(mixed(m, Loud)).toBe(true)
  expect(mixed(m, Stash)).toBe(true)
})
