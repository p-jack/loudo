import { beforeEach, describe, expect, test } from "vitest"
import { NMap } from "./index"
import { capture } from "loudo-ds-tools-capture"

const elements = [{key:1, value:"1"}, {key:2, value:"2"}, {key:3, value:"3"}]

let nmap = new NMap<number,string>([])
let c = capture(nmap)

beforeEach(() => {
  nmap = new NMap(elements)
  c = capture(nmap)
  expect(c.get()).toStrictEqual({added:{elements, at:0} })
})

describe("clear", () => {
  test("empty", () => {
    nmap = new NMap([])
    c = capture(nmap)
    nmap.clear()
    expect(nmap.size).toBe(0)
    expect([...nmap]).toStrictEqual([])
    expect(c.get()).toBeUndefined()
  })
  test("non-empty", () => {
    nmap.clear()
    expect(nmap.size).toBe(0)
    expect([...nmap]).toStrictEqual([])
    expect(c.get()).toStrictEqual({cleared:3})
  })
})

test("drop", () => {
  nmap.drop(pair => pair.key === 2)
  expect(nmap.size).toBe(2)
  expect([...nmap.keys]).toStrictEqual([1, 3])
  expect([...nmap.values]).toStrictEqual(["1", "3"])
  expect(c.get()).toStrictEqual({removed:{elements:[{key:2, value:"2"}]}})
})

test("get", () => {
  expect(nmap.get(1)).toBe("1")
  expect(nmap.get(2)).toBe("2")
  expect(nmap.get(3)).toBe("3")
  expect(nmap.get(4)).toBeUndefined()
})

test("iterator", () => {
  expect([...nmap]).toStrictEqual(elements)
  expect([...nmap]).toStrictEqual(elements)
})

test("keyEq", () => {
  expect(nmap.keyEq(1, 1)).toBe(true)
  expect(nmap.keyEq(1, 2)).toBe(false)
  expect(nmap.keyEq(2, 1)).toBe(false)
})

test("keys", () => {
  expect([...nmap.keys]).toStrictEqual([1, 2, 3])
  expect([...nmap.keys]).toStrictEqual([1, 2, 3])
})

describe("put", () => {
  test("new pair", () => {
    expect(nmap.put(4, "4")).toBeUndefined()
    expect(nmap.size).toBe(4)
    expect([...nmap.keys]).toStrictEqual([1, 2, 3, 4])
    expect([...nmap.values]).toStrictEqual(["1", "2", "3", "4"])
    expect(c.get()).toStrictEqual({
      added:{elements:[{key:4,value:"4"}]},
    })
  })
  test("existing pair", () => {
    expect(nmap.put(1, "one")).toBe("1")
    expect(nmap.size).toBe(3)
    expect([...nmap.keys]).toStrictEqual([1, 2, 3])
    expect([...nmap.values]).toStrictEqual(["one", "2", "3"])
    expect(c.get()).toStrictEqual({
      removed:{elements:[{key:1,value:"1"}]},
      added:{elements:[{key:1,value:"one"}]},
    })
  })
  test("same value", () => {
    expect(nmap.put(1, "1")).toBe("1")
    expect(nmap.size).toBe(3)
    expect([...nmap]).toStrictEqual(elements)
    expect(c.get()).toBeUndefined()
  })
})

describe("putAll", () => {
  test("non-empty", () => {
    nmap.putAll([{key:4,value:"4"},{key:1,value:"1"}])
    expect(c.get()).toStrictEqual({added:{elements:[{key:4,value:"4"}]}})
  })
  test("empty", () => {
    nmap.clear()
    nmap.putAll(elements)
    expect(c.get()).toStrictEqual({added:{elements, at:0}})
  })
})

describe("removeKey", () => {
  test("extant key", () => {
    expect(nmap.removeKey(1)).toBe("1")
    expect(nmap.size).toBe(2)
    expect([...nmap.keys]).toStrictEqual([2, 3])
    expect([...nmap.values]).toStrictEqual(["2", "3"])
    expect(c.get()).toStrictEqual({removed:{elements:[{key:1, value:"1"}]}})  
  })
  test("non-extant key", () => {
    expect(nmap.removeKey(4)).toBeUndefined()
    expect(nmap.size).toBe(3)
    expect([...nmap]).toStrictEqual(elements)
    expect(c.get()).toBeUndefined()
  })
})

describe("replace", () => {
  const n = [{key:100, value:"100"},{key:200, value:"200"}]
  test("empty with empty", () => {
    nmap.clear()
    c.get()
    nmap.replace([])
    expect(c.get()).toBeUndefined()
  })
  test("empty with non-empty", () => {
    nmap.clear()
    nmap.replace(n)
    expect(c.get()).toStrictEqual({added:{elements:n, at:0}})
  })
  test("non-empty with empty", () => {
    nmap.replace([])
    expect(c.get()).toStrictEqual({cleared:3})
  })
  test("non-empty with non-empty", () => {
    nmap.replace(n)
    expect(c.get()).toStrictEqual({
      cleared:3,
      added:{elements:n, at:0}
    })
  })
})

test("size", () => {
  expect(nmap.size).toBe(3)
})

test("valueEq", () => {
  expect(nmap.valueEq("1", "1")).toBe(true)
  expect(nmap.valueEq("1", "2")).toBe(false)
  expect(nmap.valueEq("2", "1")).toBe(false)
})

test("values", () => {
  expect([...nmap.values]).toStrictEqual(["1", "2", "3"])
  expect([...nmap.values]).toStrictEqual(["1", "2", "3"])
})