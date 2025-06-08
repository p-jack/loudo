import { Check } from "./index.js"
import { afterEach, beforeEach, describe, expect, test } from 'vitest'

const { BIGINT, Fail, addType, collectionType, conf, define, parse, parseArray, raise, recurse, check, runOne, sample } = Check

class Foo extends define({}) {
  constructor(input:Check.InputFor<Foo>) { super(input) }
}

const setType = collectionType({
  name: "test",
  make: () => new Set<unknown>(),
  appliesTo: x => x instanceof Set,
  add: (set:Set<unknown>, v:unknown) => { set.add(v) },
  sampleElement: set => set.values().next().value
})
addType(setType)

beforeEach(() => {
  const c = conf()
  c.skipInvalidObjects = false
  conf(c)
})

afterEach(() => {
  const c = conf()
  c.warn = console.warn
  c.augment = o => o
  conf(c)
})

describe("required", ()=>{
  test("yes is the default", ()=>{
    const cls = define({p:{v:"x"}})
    expect(() => {raise(cls, {}) }).toThrow("p: missing required property")
    raise(cls, {p:""})
  })
  test("explicitly required", ()=>{
    const cls = define({p:{v:"", required:true}})
    expect(() => {raise(cls, {}) }).toThrow("p: missing required property")
    raise(cls, {p:""})
  })
  test("not required", ()=>{
    const cls = define({p:{v:"", required:false}})
    raise(cls, {p:""})
    raise(cls, {})
  })
  test("default value", ()=>{
    const cls = define({p:{v:"xyzzy", required:"default"}})
    const result = raise(cls, {})
    expect(result.p).toBe("xyzzy")
    raise(cls, {p:""})
  })
  test("default object", ()=>{
    const cls1 = define({s:{v:"xyzzy"}})
    const cls2 = define({o:{v:sample(cls1), required:"default"}})
    const result = raise(cls2, {})
    expect(result.o.s).toBe("xyzzy")
    raise(cls2, {o:{s:"qworp"}})
  })
  test("default array", ()=>{
    const cls = define({p:{v:[0], required:"default"}})
    const result = raise(cls, {})
    expect(result.p).toStrictEqual([])
    raise(cls, {p:[1,2,3]})
  })
  test("non-required fields are still validated if present", ()=>{
    const cls = define({
      p:{v:0, required:false, min:0}
    })
    expect(() => {raise(cls, {p:-1})}).toThrow("p: value of -1 < minimum value of 0")
  })
})

function newDate(year:number):Date {
  return new Date(Date.UTC(year, 1, 1, 0, 0, 0, 0))
}

describe("min", ()=>{
  test("number", ()=>{
    const cls = define({v:{ v:10, min:10 }})
    expect(() => {raise(cls, {v:5}) }).toThrow("v: value of 5 < minimum value of 10")
    raise(cls, {v:10})
    raise(cls, {v:11})
    raise(cls, {v:110000})
  })
  test("BigInt", ()=>{
    const cls = define({v:{ v:BigInt(10), min:10 }})
    expect(() => {raise(cls, {v:BigInt(5)}) }).toThrow("v: value of 5 < minimum value of 10")
    raise(cls, {v:BigInt(10)})
    raise(cls, {v:BigInt(11)})
    raise(cls, {v:BigInt(110000)})
  })
  test("Date", ()=>{
    const cls = define({v:{ v:newDate(1970), min:10 }})
    expect(() => {raise(cls, {v:newDate(1969)}) }).toThrow("< minimum value of")
    raise(cls, {v:newDate(1970)})
    raise(cls, {v:newDate(2000)})
    raise(cls, {v:newDate(110000)})
  })
  test("string (length)", ()=>{
    const cls = define({v:{ v:"1234567890", min:10 }})
    expect(() => {raise(cls, {v:"12345"}) }).toThrow("v: length of 5 < minimum length of 10")
    raise(cls, {v:"1234567890"})
    raise(cls, {v:"1234567890A"})
    raise(cls, {v:"1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ"})
  })
  test("set (size)", () => {
    const cls = define({set:{ v:new Set([0]), min:1}})
    expect(() => {raise(cls, {set:[]})}).toThrow("set: size of 0 < minimum size of 1")
    expect(() => {new cls({set:new Set([])})}).toThrow("set: size of 0 < minimum size of 1")
    expect(() => {new cls({set:new Set([1])})}).not.toThrowError()
  })
})

describe("max", ()=>{
  test("number", ()=>{
    const cls = define({v:{ v:0, max:10 }})
    expect(() => {raise(cls, {v:50}) }).toThrow("v: value of 50 > maximum value of 10")
    raise(cls, {v:10})
    raise(cls, {v:9})
    raise(cls, {v:-110000})
  })
  test("BigInt", ()=>{
    const cls = define({v:{ v:BigInt(10), max:BigInt(10) }})
    expect(() => {raise(cls, {v:BigInt(50)}) }).toThrow("v: value of 50 > maximum value of 10")
    raise(cls, {v:BigInt(10)})
    raise(cls, {v:BigInt(9)})
    raise(cls, {v:BigInt(-110000)})
  })
  test("Date", ()=>{
    const cls = define({v:{ v:newDate(0), max:newDate(1970) }})
    expect(() => {raise(cls, {v:newDate(1971)}) }).toThrow("> maximum value of")
    raise(cls, {v:newDate(1969)})
    raise(cls, {v:newDate(1800)})
  })
  test("string (length)", ()=>{
    const cls = define({v:{ v:"", max:3 }})
    expect(() => {raise(cls, {v:"12345"}) }).toThrow("v: length of 5 > maximum length of 3")
    raise(cls, {v:"123"})
    raise(cls, {v:"12"})
    raise(cls, {v:""})
  })
  test("set (size)", () => {
    const cls = define({set:{ v:new Set([0]), max:1}})
    expect(() => {raise(cls, {set:[1, 2]})}).toThrow("set: size of 2 > maximum size of 1")
    expect(() => {new cls({set:new Set([1,2])})}).toThrow("set: size of 2 > maximum size of 1")
    raise(cls, {set:new Set()})
  })
})

describe("allowed", ()=>{
  test("allowed", ()=>{
    const cls = define({v:{ v:"a", allowed:["a","b","c"]}})
    expect(() => {raise(cls, {v:"d"}) }).toThrow("v: invalid value: d - valid values are: a,b,c")
    raise(cls, {v:"a"})
    raise(cls, {v:"b"})
    raise(cls, {v:"c"})
  })
  test("fallback", () => {
    const cls = define({v:{ v:"a", allowed:["a","b","c"], fallback:"a"}})
    const r = raise(cls, {v:"x"})
    expect(r.v).toBe("a")
  })
})

test("regex", () => {
  const cls = define({s:{ v:"abc", regex:/abc/}})
  expect(() => {raise(cls, {s:"a"})}).toThrow("s: invalid value: a - must match /abc/")
  expect(() => {raise(cls, {s:""})}).toThrow("s: invalid value:  - must match /abc/")
  raise(cls, {s:"abc"})
  raise(cls, {s:"123abc"})
  raise(cls, {s:"1abc1"})
})

describe("integer", () => {
  test("true by default", () => {
    const cls = define({n:{v:0}})
    expect(() => {raise(cls, {n:3.1})}).toThrow("n: value of 3.1 is not a safe integer")
    expect(() => {raise(cls, {n:2**53})}).toThrow("n: value of 9007199254740992 is not a safe integer")
    raise(cls, {n:-1000})
    raise(cls, {n:2**53-1})
  })
  test("explicitly set to true", () => {
    const cls = define({n:{v:0, integer:true}})
    expect(() => {raise(cls, {n:3.1})}).toThrow("n: value of 3.1 is not a safe integer")
    expect(() => {raise(cls, {n:2**53})}).toThrow("n: value of 9007199254740992 is not a safe integer")
    raise(cls, {n:-1000})
    raise(cls, {n:2**53-1})
  })
  test("false", () => {
    const cls = define({n:{v:0, integer:false}})
    raise(cls, {n:-1000})
    raise(cls, {n:2**53-1})
    raise(cls, {n:2**53})
    raise(cls, {n:3.14})
  })
})

test("custom", ()=>{
  const cls = define({
    v:{
      v:0,
      custom:(value:number)=>{
        if (value % 2 !== 0) {
          return new Fail("v", "EVEN", "must be even")
        }
        return undefined
      }
    }
  })
  expect(() => {raise(cls, {v:1}) }).toThrow("must be even")
  raise(cls, {v:0})
})

describe("nested objects", () => {
  test("skipping", () => {
    const logs:string[] = []
    const c = conf()
    c.skipInvalidObjects = true
    c.warn = msg => logs.push(msg)
    conf(c)
    const cls2 = define({ s: {v:"1", min:1}})
    const sample2 = sample(cls2)
    const cls1 = define({
      o1: {v:sample2},
      o2: {v:sample2, required:false}
    })
    const good = { o1: { s: "1" }, o2: { s:[] } }
    const r = raise(cls1, good)
    expect(r.o2).toBeUndefined()
    expect(logs[0]).toBe("skipping nested object o2.s - expected string but got array")
  })
  test("not skipping", () => {
    const cls2 = define({ s:{v:"1", min:1 }})
    const cls1 = define({ o:{v:sample(cls2) }})
    const good = { o: { s: "2" } }
    const r = check(cls1, good)
    if (r.success) {
      expect(r.result.o.s).toBe("2")
    } else {
      expect(r.success).toBe(true)
    }
    const bad = { o: { s: "" } }
    expect(() => { raise(cls1, bad) }).toThrow("o.s: length of 0 < minimum length of 1")
  })
  test("already checked", () => {
    const cls2 = define({ s:{v:"1", min:1 }})
    const cls1 = define({ o:{v:sample(cls2) }})
    const o2 = new cls2({s:"22"})
    const o1a = new cls1({o:o2})
    expect(o1a.o === o2).toBe(true)
    const o1b = new cls1(o1a)
    expect(o1b.o === o2).toBe(true)
  })
})

describe("nested arrays", () => {
  test("primitive elements", () => {
    const cls = define({ a:{ v:[""] } })
    const good1 = { a:["1", "2", "3"] }
    const parsed1 = raise(cls, good1)
    expect(parsed1.a.length).toBe(3)
    expect(parsed1.a[0]).toBe("1")
    expect(parsed1.a[1]).toBe("2")
    expect(parsed1.a[2]).toBe("3")
    const good2 = { a:[] }
    raise(cls, good2)
    const bad = { a:[1, 2, 3] }
    expect(() => { raise(cls, bad)}).toThrow("a[0]: expected string but got number")
  })
  test("deep nest", () => {    
    class c1 extends define({ a:{ v:[0], min:3, max:3 }}) {}
    const o1 = new c1({a:[11,22,33]})
    class c2 extends define({ o:{ v:sample(c1)}}) {}
    const o2 = new c2({o:o1})
    expect(o2.o.a.length).toBe(3)
    expect(o2.o.a[0]).toBe(11)
    expect(o2.o.a[1]).toBe(22)
    expect(o2.o.a[2]).toBe(33)
  })
  test("object elements", () => {
    class Element extends (define({ n: { v:1, min:1 }})) {
      public get nn() { return this.n + this.n }
    }
    const sampleElement = sample(Element)
    const cls = define({ a:{ v:[sampleElement] }})
    const good1 = { a:[] }
    raise(cls, good1)
    const good2 = { a:[{ n:11 }, { n:22 }, { n:33 }]}
    const x = raise(cls, good2)
    expect(x.a[0]?.n).toBe(11)
    expect(x.a[0]?.nn).toBe(22)
    const bad1 = { a:[1,2,3] }
    expect(() => { raise(cls, bad1)}).toThrow("a[0]: expected object but got number")
    const bad2 = { a:[{ n:0 }]}
    expect(() => { raise(cls, bad2)}).toThrow("a[0].n: value of 0 < minimum value of 1")
  })
  test("skipping", () => {
    const logs:string[] = []
    const c = conf()
    c.skipInvalidObjects = true
    c.warn = msg => logs.push(msg)
    conf(c)
    const sampleCls = define({ n: { v:1, required:true }})
    const sampleElement = sample(sampleCls)
    const cls = define({ a: { v:[sampleElement] }})
    const r = raise(cls, { a: [
      { n: undefined },
      { n: 2 },
      { n: undefined },
      { n: 4 },
      { n: undefined },
    ]})
    expect(r.a.length).toBe(2)
    expect(r.a[0]?.n).toBe(2)
    expect(r.a[1]?.n).toBe(4)
    expect(logs[0]).toBe("skipping element a[0].n - missing required property")
    expect(logs[1]).toBe("skipping element a[2].n - missing required property")
    expect(logs[2]).toBe("skipping element a[4].n - missing required property")

    const r2 = raise(cls, { a:[
      { n: undefined },
      { n: undefined }, 
    ]})
    expect(r2.a.length).toBe(0)
  })
  test("not required", () => {
    class C2 extends define({n:{v:0}}) {}
    class C1 extends define({a:{v:[sample(C2)], required:false}}) {}
    const o1 = raise(C1, {})
    expect(o1.a).toBeUndefined()
  })
})

describe("runOne", () => {
  test("existing field", () => {
    const cls = define({ n:{ v:10, min:0 }})
    const obj = { n:0 }
    const fails = runOne(cls, obj, "n", -1)
    expect(fails).toHaveLength(1)
    expect(fails[0]?.prefix).toBe("n")
    expect(fails[0]?.code).toBe("MIN")
    expect(fails[0]?.message).toBe("value of -1 < minimum value of 0")
  })
  test("missing field", () => {
    const cls = define({ n:{ v:10, min:0 }})
    const obj = { x:0 }
    const fails = runOne(cls, obj as any, "x", -1)
    expect(fails).toHaveLength(0)
  })  
})

test("parse", () => {
  class E extends define({p:{v:""}}) {}
  const e = parse(E, '{"p":"s"}')
  expect(e.p).toBe("s")
  expect(()=>{ parse(E, '{"p":0}')}).toThrow("p: expected string but got number")
  class A extends define({a:{v:[new E({p:""})]}}) {}
  const a = parse(A, '{"a":[{"p":"s"}]}')
  expect(a.a.length).toBe(1)
  expect(a.a[0]?.p).toBe("s")
  expect(E === e.constructor).toBe(true)
  expect(a.constructor === A).toBe(true)
})

test("parseArray", () => {
  class C extends define({n:{v:0, min:0}}) {}
  const a = parseArray(C, `[{"n":11},{"n":22},{"n":33}]`)
  expect(a.length).toBe(3)
  expect(a[0]!.n).toBe(11)
  expect(a[1]!.n).toBe(22)
  expect(a[2]!.n).toBe(33)
  expect(() => { parseArray(C, `[{"n":-1}]`)}).toThrow("minimum value")
  expect(() => { parseArray(C, `{}`)}).toThrow("expected input array but got object")
})

test("mismatches", () => {
  const cls1 = define({a:{v:[""]}})
  expect(()=>{ raise(cls1, {a:""})}).toThrow("a: expected array but got string")
  const cls2 = define({s:{v:""}})
  expect(()=>{ raise(cls2, {s:[]})}).toThrow("s: expected string but got array")
})

test("constructors", () => {
  class C extends define({n:{v:1,min:1}}) {}
  const obj = new C({n:1})
  expect(obj.n).toBe(1)
  expect(()=>{ new C({n:0})}).toThrow("n: value of 0 < minimum value of 1")
})

test("recursive data types", () => {
  interface BarI {
    bar: number
    foo?: Foo
    plusOne: number
    add(x:number):number
  }
  class Foo extends define({
    foo: { v:0 },
    bar: { v:null as unknown as BarI, required:false }
  }) {}
  class Bar extends define({
    bar: { v:0 },
    foo: { v:sample(Foo), required:false }
  }) implements BarI {
    get plusOne() { return this.bar + 1 }
    add(x:number) { return this.bar + x }
  }
  recurse(Foo, "bar", sample(Bar))
  const text = `{"foo":11,"bar":{"bar":22}}`
  const foo = parse(Foo, text)
  expect(foo.bar?.add(3)).toBe(25)
  expect(foo.bar?.plusOne).toBe(23)
})

test("types", () => {
  addType({
    name:"bigint",
    priority:500_000_000,
    appliesTo:(v:unknown) => typeof(v) === "bigint",
    defaultTo:(sample:BigInt) => sample,
    mismatch:(json:unknown) => {
      if (typeof(json) !== "string") return `expected bigint string but got ${typeof(json)}`
      return false
    },
    parse:(prefix:string, _:unknown, json:unknown) => {
      try {
        return { success:true, result:BigInt(json as string) }
      } catch (e:any) {
        const msg = "message" in e ? e.message : "invalid bigint string"
        return { success:false, fail:new Fail(prefix, BIGINT, msg) }
      }
    }
  })
  class C extends define({n:{v:BigInt(0)}}) {}
  const o = raise(C, {n:"101"})
  expect(o.n).toBe(BigInt(101))
  expect(()=>{ raise(C, {n:"xxx"})}).toThrow("n: Cannot convert xxx to a BigInt")
})

test("collection type resolution", () => {
  class A extends define({a:{v:[0]}}) {}
  const a = raise(A, {a:[11,22,33]})
  expect(a.a[0]).toBe(11)
  expect(a.a[1]).toBe(22)
  expect(a.a[2]).toBe(33)
  class S extends define({s:{v: new Set([0])}}) {}
  const s = raise(S, {s:[11,22,33]})
  expect(s.s).toBeInstanceOf(Set)
  expect(s.s.has(11)).toBe(true)
  expect(s.s.has(22)).toBe(true)
  expect(s.s.has(33)).toBe(true)
  const set = new Set([111,222,333])
  const s1 = new S({s:set})
  expect(set === s1.s).toBe(true)

})

test("augment", () => {
  let target:any = null
  let key:string|symbol = ""
  let value:any = null
  const c = conf()
  c.augment = o => new Proxy(o, {
    set:(t, k, v) => {
      target = t
      key = k
      value = v
      return true
    }
  })
  conf(c)
  class C extends define({n:{v:0}}) {}
  const instance = new C({n:0})
  instance.n = 5
  expect(key).toBe("n")
  expect(value).toBe(5)
  expect(target).toStrictEqual(instance)
})

test("extensions", () => {
  class C extends define({n:{v:0}}) { get plus1() { return this.n + 1}}
  const r = check(C, {n:100})
  expect(r.success).toBe(true)
  if (r.success) {
    const o:C = r.result
    expect(o.n).toBe(100)
    expect(o.plus1).toBe(101)
  }
  const o = raise(C, {n:200})
  expect(o.n).toBe(200)
  expect(o.plus1).toBe(201)
})
