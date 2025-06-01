import { test, expect, describe } from "vitest"
import { Stash, Loud, LEvent, stash, sized } from "./index"
import { mixin } from "loudo-mixin"

const empty = stash<number>([])

describe("Stash", () => {
  test("all", () => {
    const a = stash([1, 2, 3])
    expect(a.all(x => x > 0)).toBe(true)
    expect(a.all(x => x > 2)).toBe(false)
    expect(empty.all(() => true)).toBe(false)
  })
  test("any", () => {
    const a = stash([1, 2, 3])
    expect(a.any(x => x > 2)).toBe(true)
    expect(a.any(x => x < 0)).toBe(false)
    expect(empty.any(() => true)).toBe(false)
  })
  test("eq", () => {
    const ds0 = stash<number>([])
    expect(ds0.eq === Object.is).toBe(true)
    expect(ds0.eq(1, 1)).toBe(true)
  })
  test("forEach", () => {
    const ds = stash([1, 2, 3, 4, 5])
    let sum = 0
    ds.forEach(x => sum += x)
    expect(sum).toBe(15)
  })
  test("filter", () => {
    const ds = stash([1, 2, 3, 4, 5, 6])
    const f = ds.filter(x => x % 2 == 0)
    expect([...f]).toStrictEqual([2, 4, 6])
    expect(f.has(4)).toBe(true)
  })
  test("first", () => {
    expect(stash([]).first).toBeUndefined()
    expect(stash([11]).first).toBe(11)
    expect(stash([111, 222, 333]).first).toBe(111)
  })
  test("has", () => {
    const ds = stash([11, 22, 33])
    expect(ds.has(11)).toStrictEqual(true)
    expect(ds.has(22)).toStrictEqual(true)
    expect(ds.has(33)).toStrictEqual(true)
    expect(ds.has(44)).toStrictEqual(false)
  })
  test("map", () => {
    const ds = stash([1, 2, 3])
    const m = ds.map(x => x * 2)
    expect([...m]).toStrictEqual([2, 4, 6])
    expect(m.has(6)).toBe(true)
  })
  describe("only", () => {
    test("zero", () => {
      expect(() => { stash([]).only }).toThrowError()
    })
    test("one", () => {
      expect(stash([1111]).only).toBe(1111)
    })
    test("many", () => {
      expect(() => { stash([1111, 2222, 3333]).only }).toThrowError()
    })
  })
  test("reduce", () => {
    const ds = stash([1, 2, 3])
    expect(ds.reduce(0, (a,x) => a + x)).toStrictEqual(6)
  })
  test("toJSON", () => {
    const ds = stash([1, 2, 3])
    expect(ds.toJSON()).toStrictEqual([1, 2, 3])
  })
  test("toString", () => {
    const ds = stash([1, 2, 3])
    expect(ds.toString()).toStrictEqual("[1,2,3]")
  })
})

describe("Sized", () => {
  test("empty", () => {
    const ds0 = sized([], () => 0)
    expect(ds0.empty).toStrictEqual(true)
    const ds1 = sized([11], () => 1)
    expect(ds1.empty).toStrictEqual(false)
    const ds3 = sized([11, 22, 33], () => 3)
    expect(ds3.empty).toStrictEqual(false)
  })
  test("map", () => {
    const ds3 = sized([11, 22, 33], () => 3)
    const m = ds3.map(x => x + 1)
    expect([...m]).toStrictEqual([12, 23, 34])
    expect(m.size).toBe(3)
    expect(m.has(23)).toBe(true)
  })
})

class Arr {
  constructor(private readonly a:number[] = []) { }
  get size() { return this.a.length }
  [Symbol.iterator]() { return this.a[Symbol.iterator]() }
}
interface Arr extends Loud<number> {}
mixin(Arr, [Loud])

describe("Loud", () => {
  describe("hear", () => {
    test("no existing elements", () => {
      const ds = new Arr([])
      let captured:LEvent<number>|undefined = undefined
      const ear = (event:LEvent<number>) => {
        captured = event
      }
      const heard = ds.hear(globalThis, ear)
      expect(captured).toBeUndefined()
      ds.unhear(heard)
    })
    test("with existing elements", () => {
      const ds = new Arr([1, 2, 3])
      let captured:LEvent<number>|undefined = undefined
      const ear = (event:LEvent<number>) => {
        captured = event
      }
      const heard = ds.hear(globalThis, ear)
      expect(captured).not.toBeUndefined()
      expect(captured!.cleared).toBeUndefined()
      expect(captured!.removed).toBeUndefined()
      expect(captured!.added).not.toBeUndefined()
      expect(captured!.added!.at).toBe(0)
      expect([...captured!.added!.elements]).toStrictEqual([1, 2, 3])
      ds.unhear(heard)
    })
    test("unhear never heard", () => {
      const ds1 = new Arr([])
      const ds2 = new Arr([4,5,6])
      let captured:LEvent<number>|undefined = undefined
      const ear = (event:LEvent<number>) => {
        captured = event
      }
      const heard = ds1.hear(globalThis, ear)
      ds2.unhear(heard)
    })
  })
})

class N extends Stash<number> {
  get size() { return 5 }
  *[Symbol.iterator]() {
    for (let i = 0; i < 5; i++) yield (i + 1) * 11
  }
}

test("default eq", () => {
  expect(new N().eq === Object.is).toBe(true)
})