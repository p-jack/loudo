import { Check, La, define, oneOff, parse, sample, tab } from "./index"
import {
  describe,
  expect,
  test,
} from 'vitest'

test("models", () => {
  class C extends define({
    id: { v:0, min:1 },
    type: { v:"user" as const, allowed:["user"], required:"default" },
    handle: { v:"", min:1 },
  }) {}

  const obj = new C({id:1, handle:"x"})
  let captured:C|undefined = undefined
  let count = 0
  obj.hear("handle", o => {
    captured = obj
    count++
  })
  expect(count).toBe(1)
  expect(captured).toBe(obj)

  captured = undefined
  obj.handle = "y"
  expect(captured).toBe(obj)
  expect(count).toBe(2)
  expect(obj.handle).toBe("y")

  captured = undefined
  count = 0
  expect(() => { obj.handle = "" }).toThrow("minimum length")
  expect(captured).toBeUndefined()
  expect(count).toBe(0)
  expect(obj.handle).toBe("y")
})

test("La can be parsed", () => {
  class E extends Check.define({
    n: { v:0, min:1 }
  }) {}
  const e = new E({n:1})
  class C extends define({
    elements: { v:new La<E>(sample(E)) }
  }) {}
  const c = new C({elements:new La<E>()})
  expect(c.constructor === C).toBe(true)
  expect(e.constructor === E).toBe(true)
  const o = parse(C, `{"elements":[{"n":11},{"n":22},{"n":33}]}`)
  expect(o.elements.length).toBe(3)
  expect(o.elements).toBeInstanceOf(La)
})

describe("tab", () => {
  test("resize", () => {
    expect(tab.width).toBe(1024)
    expect(tab.height).toBe(768)
    window.innerWidth = 360
    window.innerHeight = 500
    let heardWith = 0
    tab.hear("width", () => {
      heardWith = tab.width
    })
    let heardHeight = 0
    tab.hear("height", () => {
      heardHeight = tab.height
    })
    window.dispatchEvent(new Event("resize"))
    expect(tab.width).toBe(360)
    expect(tab.height).toBe(500)
    expect(heardWith).toBe(360)
    expect(heardHeight).toBe(500)
  })
  test("location", async () => {
    expect(tab.path).toBe("/")
    tab.goTo("/some/other/path")
    expect(tab.path).toBe("/some/other/path")
    let heard = ""
    tab.hear("location", () => {
      heard = tab.path
    })
    window.history.back()
    setTimeout(()=>{
      expect(tab.path).toBe("/")
      expect(heard).toBe("/")  
    }, 1000)
  })
})
