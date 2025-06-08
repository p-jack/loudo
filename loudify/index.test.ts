import { checkWith, compareWith, extendWith, loudify, Loud, Mutable, quiet } from "./index.js"
import { afterEach, beforeEach, describe, expect, test } from 'vitest'

afterEach(() => {
  extendWith(() => {})
  compareWith(Object.is)
  checkWith(():void => {})
})

test("not checked by default", () => {
  const obj = loudify({ n:0 })
  expect(() => { obj.n = undefined as never }).not.toThrowError()
})

describe("loudify", () => {
  class I {
    constructor(
      public id:number,
      public email:string,
      public readonly firstName:string,
      public readonly lastName:string,
    ) {}
    public get name() { return this.firstName + " " + this.lastName }
    public setName = (first:string, last:string) => {
      (this as Record<string,unknown>).firstName = first;
      (this as Record<string,unknown>).lastName = last;
      return this.name
    }
  }
  let obj:I&Loud
  let keeper = {}
  let newValue:string|undefined
  let oldValue:string|undefined
  const ear = (n:string, o?:string) => {
    newValue = n
    oldValue = o
  }
  beforeEach(() => { 
    const input = new I(0, "fake@example.com", "First", "Last")
    obj = loudify(input)
    keeper = {}
    newValue = undefined 
    oldValue = undefined
  })
  test("hear and unhear", () => {
    const heard = obj.hear("email", keeper, ear)
    expect(newValue).toBe("fake@example.com")
    expect(oldValue).toBeUndefined()
    newValue = undefined
    oldValue = undefined
    obj.email = "fake2@example.com"
    expect(oldValue).toBe("fake@example.com")
    expect(newValue).toBe("fake2@example.com")
    newValue = undefined
    oldValue = undefined
    obj.unhear(heard)
    obj.email = "fake3@example.com"
    expect(newValue).toBeUndefined()
    expect(oldValue).toBeUndefined()
  })
  test("not heard", () => {
    obj.hear("email", keeper, ear)
    newValue = undefined
    obj.id = 1
    expect(newValue).toBeUndefined()
    expect(oldValue).toBeUndefined()
  })
  test("same value", () => {
    obj.hear("email", keeper, ear)
    newValue = undefined
    oldValue = undefined
    obj.email = "fake@example.com"
    expect(newValue).toBeUndefined()
    expect(oldValue).toBeUndefined()
  })
  test("multiple ears", () => {
    let captured2:string|undefined
    const ear2 = (v:string) => {
      captured2 = v
    }
    obj.hear("email", keeper, ear)
    obj.hear("email", keeper, ear2)
    expect(captured2).toBe("fake@example.com")
    newValue = undefined
    captured2 = undefined
    obj.email = "fake2@example.com"
    expect(newValue).toBe("fake2@example.com")
    expect(captured2).toBe("fake2@example.com")
  })
  test("function calls", () => {
    let captured:((f:string,l:string)=>void)|undefined
    const ear = (v:(f:string,l:string)=>void) => {
      captured = v
    }
    obj.hear("setName", keeper, ear)
    expect(captured).toBeInstanceOf(Function)
    captured = undefined
    obj.setName("Foo", "Bar")
    expect(obj.name).toBe("Foo Bar")
    expect(captured).toBeInstanceOf(Function)
  })
})

test("nested function calls", () => {
  class C {
    constructor(
      readonly x:number = 0,
      readonly y:number = 0,
      readonly dirty:boolean = false,
      readonly version:number = 0,
    ) {}
    get sum() { return this.x + this.y }
    setDirty = () => {
      const o = this as Mutable<C>
      o.version++
      o.dirty = true
    }
    setNums(x:number, y:number):number {
      const o = this as Mutable<C>
      o.x = x
      o.y = y
      this.setDirty()
      return this.sum
    }
  }
  const obj = loudify(new C())
  const keeper = {}
  let captured:Function|undefined = undefined
  let count = 0
  obj.hear("setNums", keeper, o => { captured = o; count++ })
  expect(captured).toBeInstanceOf(Function)
  expect(count).toBe(1)
  captured = undefined
  obj.setNums(11,22)
  expect(captured).toBeInstanceOf(Function)
  expect(count).toBe(2)
  expect(obj.sum).toBe(33)
  expect(obj.dirty).toBe(true)
  expect(obj.version).toBe(1)
})

test("quiet function call results", () => {
  class C {
    constructor(
      readonly x:number = 0,
    ) {}
    reset(x:number) {
      if (x < 0) {
        return quiet(false)
      }
      const o = this as Mutable<C>
      o.x = x
      return true
    }
  }
  const obj = loudify(new C())
  const keeper = {}
  let captured:Function|undefined = undefined
  let count = 0
  obj.hear("reset", keeper, o => { captured = o; count++ })
  expect(captured).toBeInstanceOf(Function)
  expect(count).toBe(1)
  captured = undefined
  obj.reset(-1)
  expect(captured).toBeUndefined()
  expect(count).toBe(1)
  obj.reset(1)
  expect(captured).toBeInstanceOf(Function)
  expect(count).toBe(2)
  expect(obj.x).toBe(1)
})

describe("hearFar", () => {
  let leaf = loudify({x:11, y:22})
  let o1 = loudify({leaf:leaf as typeof leaf|undefined})
  let o2 = loudify({o1:o1 as typeof o1|undefined})
  let oldValue:number|undefined
  let newValue:number|undefined
  let called = false
  const reset = () => {
    oldValue = undefined
    newValue = undefined
    called = false
  }
  beforeEach(() => {
    reset()
    leaf = loudify({x:11, y:22})
    o1 = loudify({leaf:leaf as typeof leaf|undefined})
    o2 = loudify({o1:o1 as typeof o1|undefined})
    o2.hearFar(["o1", "leaf", "x"], globalThis, (n,o) => {
      called = true
      oldValue = o
      newValue = n
    })    
  })
  test("immediate fire", () => {
    expect(called).toBe(true)
    expect(oldValue).toBeUndefined()
    expect(newValue).toBe(11)  
  })
  test("no change", () => {
    reset()
    leaf.x = 11
    expect(called).toBe(false)
    expect(oldValue).toBeUndefined()
    expect(newValue).toBeUndefined()  
  })
  test("leaf change", () => {
    reset()
    leaf.x = 111
    expect(called).toBe(true)
    expect(oldValue).toBe(11)
    expect(newValue).toBe(111)  
  })
  test("o1 change", () => {
    reset()
    o1.leaf = loudify({x:33, y:44})
    expect(called).toBe(true)
    expect(newValue).toBe(33)
    expect(oldValue).toBe(undefined)  
  })
  test("o1 removal", () => {
    reset()
    o1.leaf = undefined
    expect(called).toBe(true)
    expect(newValue).toBeUndefined()
    expect(oldValue).toBeUndefined()
  })
  test("o2 change", () => {
    reset()
    const leaf = loudify({x:33, y:44})
    o2.o1 = loudify({leaf})
    expect(called).toBe(true)
    expect(newValue).toBe(33)
    expect(oldValue).toBeUndefined()
  })
  test("o2 removal", () => {
    reset()
    o2.o1 = undefined
    expect(called).toBe(true)
    expect(newValue).toBeUndefined()
    expect(oldValue).toBeUndefined()
  })

})

test("extendWith", () => {
  extendWith(<T extends object>(loud:Loud&T) => {
    (loud as any)["flag"] = true
  })
  const obj = loudify({s:""})
  expect((obj as any)["flag"]).toBe(true)
})

test("compareWith", () => {
  compareWith((a:any, b:any) => {
    if ((typeof(a) == "string") && (typeof(b) === "string")) {
      return a.toLowerCase() === b.toLowerCase()
    }
    return Object.is(a, b)
  })
  const obj = loudify({s:"a"})
  const keeper = {}
  let flag = false
  obj.hear("s", keeper, () => {
    flag = true
  })
  flag = false
  obj.s = "A"
  expect(flag).toBe(false)
})

test("checkWith", () => {
  const check = <T extends object,K extends keyof T>(_1:T, _2:K, v:T[K]) => {
    if (v === "fail") throw new Error("failed")
  }
  checkWith(check)
  const obj = loudify({ s:"" })
  expect(() => { obj.s = "fail" }).toThrow("failed")  
})

// describe("tx", () => {
//   test("happy path", () => {
//     const a = loudify({n:111})
//     const b = loudify({x:222})
//     let agood = false
//     let acount = 0
//     a.hear("n", (v:typeof a) => {
//       acount++
//       agood = (v.n === 333) && (b.x === 444)
//     })
//     let bgood = false
//     let bcount = 0
//     b.hear("x", (v:typeof b) => {
//       bcount++
//       bgood = (a.n === 333) && (v.x === 444)
//     })
//     acount = 0
//     bcount = 0
//     const tx = new Tx()
//     tx.batch(a, {n:333})
//     tx.batch(b, {x:444})
//     tx.commit()
//     expect(agood).toBe(true)
//     expect(acount).toBe(1)
//     expect(bgood).toBe(true)
//     expect(bcount).toBe(1)
//   })
//   test("check failure", () => {
//     checkWith(<T extends object,K extends keyof T>(_1:T, _2:K, v:T[K]) => {
//       if (v === 2) throw new Error("fail")
//     })
//     const o = loudify({x:1,y:3})
//     const tx = new Tx()
//     tx.batch(o, {x:3,y:2})
//     expect( () => { tx.commit() }).toThrow("fail")
//     expect(o.x).toBe(1)
//     expect(o.y).toBe(3)
//   })
// })

test("constructors", () => {
  class C {
    constructor(public x:number) {}
  }
  const o = loudify(new C(0))
  expect(o).toBeInstanceOf(C)
  expect(o.constructor === C).toBe(true)  
})
