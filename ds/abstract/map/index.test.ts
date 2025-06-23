import { test, expect, describe, beforeEach } from "vitest"
import { MapBase, MapChange, Pair, Pairs, MapRemove, forEach } from "./index"
import { mixin, mixed } from "loudo-mixin"
import { Loud, Sized, Stash } from "loudo-ds-core"

class Nums {
  constructor(readonly limit = 5) {}
  get valueEq() { return Object.is }
  get keyEq() { return Object.is }
  get size() { return this.limit }
  get(key:number):number|undefined {
    if (key < 0 || key >= this.size) return undefined
    return key * 2
  }
  *[Symbol.iterator]() { for (let i = 0; i < this.size; i++) yield { key:i, value:i * 2 } }
}
interface Nums extends MapBase<number,number> {}
mixin(Nums, [MapBase])

describe("MapBase", () => {
  let map = new Nums(3)
  beforeEach(() => { 
    map = new Nums(3)
  })
  test("eq", () => {
    expect(map.eq({key:1, value:2}, {key:1, value:2})).toBe(true)
    expect(map.eq({key:1, value:2}, {key:2, value:2})).toBe(false)
    expect(map.eq({key:1, value:2}, {key:1, value:1})).toBe(false)
    expect(map.eq({key:1, value:2}, {key:2, value:1})).toBe(false)
  })
  test("has", () => {
    expect(map.has({key:0, value:0})).toBe(true)
    expect(map.has({key:4, value:0})).toBe(false)
    expect(map.has({key:4, value:7})).toBe(false)
    expect(map.has({key:4, value:8})).toBe(false)
  })
  test("hasKey", () => {
    expect(map.hasKey(-1)).toBe(false)
    expect(map.hasKey(0)).toBe(true)
    expect(map.hasKey(1)).toBe(true)
    expect(map.hasKey(2)).toBe(true)
    expect(map.hasKey(3)).toBe(false)
  })
  test("keys", () => {
    expect([...map.keys]).toStrictEqual([0, 1, 2])
    expect([...map.keys]).toStrictEqual([0, 1, 2])
  })
  test("mixins", () => {
    expect(mixed(map, MapBase)).toBe(true)
    expect(mixed(map, Sized)).toBe(true)
    expect(mixed(map, Stash)).toBe(true)
  })
  test("values", () => {
    expect([...map.values]).toStrictEqual([0, 2, 4])
    expect([...map.values]).toStrictEqual([0, 2, 4])
  })
})

class M {
  m = new Map<string,number>
  get valueEq() { return Object.is }
  get keyEq() { return Object.is }
  get size() { return this.m.size }
  get(key:string):number|undefined {
    return this.m.get(key)
  }
  *[Symbol.iterator]() {
    for (const [k,v] of this.m) yield { key:k, value:v }
  }
}
interface M extends MapChange<string,number>,MapRemove<string,number> {}
mixin(M, [MapChange, MapRemove])


test("mixins", () => {
  const map = new M()
  expect(mixed(map, MapBase)).toBe(true)
  expect(mixed(map, Sized)).toBe(true)
  expect(mixed(map, Stash)).toBe(true)
  expect(mixed(map, MapChange)).toBe(true)
  expect(mixed(map, MapRemove)).toBe(true)
  expect(mixed(map, Loud)).toBe(true)
})

describe("forEach", () => {
  let a:Pair<string,number>[] = []
  const f = (key:string,value:number) => a.push({key,value})
  beforeEach(() => {
    a = []
  })
  const elements1 = [{key:"one", value:1}, {key:"two", value:2}]
  test("object", () => {
    forEach({"one":1, "two":2}, f)
    expect(a).toStrictEqual(elements1)
  })
  test("tuples", () => {
    const input = new Map<string,number>()
    input.set("one", 1)
    input.set("two", 2)
    forEach(input, f)
    expect(a).toStrictEqual(elements1)
  })
  test("entries", () => {
    forEach(elements1, f)
    expect(a).toStrictEqual(elements1)
  })
})