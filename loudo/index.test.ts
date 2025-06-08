import { Ar } from "loudo-ds-array"
import { Check, ar as a, Viewport } from "./index"
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { Loud } from "loudify"
import { Browser, BrowserPage } from "happy-dom"

import { PropertySymbol } from "happy-dom";

// It was "ownerWindow" in older versions of Happy DOM
const browserWindow = global.document[PropertySymbol.window];

global.setTimeout = browserWindow.setTimeout;
global.clearTimeout = browserWindow.clearTimeout;
global.setInterval = browserWindow.setInterval;
global.clearInterval = browserWindow.clearInterval;
global.requestAnimationFrame = browserWindow.requestAnimationFrame;
global.cancelAnimationFrame = browserWindow.cancelAnimationFrame;
global.queueMicrotask = browserWindow.queueMicrotask;

declare module "loudo-check" {
  export namespace Check {
    export interface Base extends Loud {}
  }
}


test("models", () => {
  class C extends Check.define({
    id: { v:0, min:1 },
    type: { v:"user" as const, allowed:["user"], required:"default" },
    handle: { v:"", min:1 },
  }) {}
  const obj = new C({id:1, handle:"x"})
  expect(obj instanceof Check.Base).toBe(true)
  let captured:string|undefined = undefined
  let count = 0
  obj.hear("handle", globalThis, o => {
    captured = o
    count++
  })
  expect(count).toBe(1)
  expect(captured).toBe("x")

  captured = undefined
  obj.handle = "y"
  expect(captured).toBe("y")
  expect(count).toBe(2)
  expect(obj.handle).toBe("y")

  captured = undefined
  count = 0
  expect(() => { obj.handle = "" }).toThrow("minimum length")
  expect(captured).toBeUndefined()
  expect(count).toBe(0)
  expect(obj.handle).toBe("y")
})

test("data structures can be parsed", () => {
  class E extends Check.define({
    n: { v:0, min:1 }
  }) {}
  const e = new E({n:1})
  class C extends Check.define({
    elements: { v:a(E) }
  }) {}

  const c = new C({elements:Ar.of<E>()})
  expect(c.constructor === C).toBe(true)
  expect(e.constructor === E).toBe(true)
  const o = Check.parse(C, `{"elements":[{"n":11},{"n":22},{"n":33}]}`)
  expect(o.elements.size).toBe(3)
  expect(o.elements).toBeInstanceOf(Ar)
})

describe("Viewport", () => {
  test("resize", () => {
    const vp = new Viewport()
    expect(vp.width).toBe(window.innerWidth)
    expect(vp.height).toBe(window.innerHeight)
    window.innerWidth = 360
    window.innerHeight = 500
    let heardWith = 0
    vp.hear("width", globalThis, () => {
      heardWith = vp.width
    })
    let heardHeight = 0
    vp.hear("height", globalThis, () => {
      heardHeight = vp.height
    })
    window.dispatchEvent(new Event("resize"))
    expect(vp.width).toBe(360)
    expect(vp.height).toBe(500)
    expect(heardWith).toBe(360)
    expect(heardHeight).toBe(500)
  })
  describe("navigation", () => {
    const originalPath = window.location.pathname
    const originalHash = window.location.hash
    afterEach(() => {
      window.location.pathname = originalPath
      window.location.hash = originalHash
    })
    test("defaults", () => {
      const vp = new Viewport()
      expect(vp.path).toBe(originalPath)
      expect(vp.hash).toBe(originalHash)
    })
    test("path only", async () => {
      const len = window.history.length
      const vp = new Viewport()
      vp.goTo("/some/other/path")
      expect(vp.path).toBe("/some/other/path")
      expect(vp.hash).toBe("")
      expect(window.history.length).toBe(len + 1)
      vp.goTo("/some/other/path")
      expect(vp.path).toBe("/some/other/path")
      expect(vp.hash).toBe("")
      expect(window.history.length).toBe(len + 1)
    })
    test("path and hash", async () => {
      const vp = new Viewport()
      vp.goTo("/path", "#hash1")
      expect(vp.path).toBe("/path")
      expect(vp.hash).toBe("#hash1")
      window.location.pathname = "/"
      window.location.hash = ""
      window.dispatchEvent(new Event("popstate"))
      expect(vp.path).toBe("/")
      expect(vp.hash).toBe("")
    })
    test("hash only", async () => {
      const len = window.history.length
      window.location.pathname = originalPath
      window.location.hash = originalHash
      const vp = new Viewport()
      vp.goToHash("#hhh")
      expect(vp.path).toBe(originalPath)
      expect(vp.hash).toBe("#hhh")
      expect(window.history.length).toBe(len + 1)
      vp.goToHash("#hhh")
      expect(vp.path).toBe(originalPath)
      expect(vp.hash).toBe("#hhh")
      expect(window.history.length).toBe(len + 1)
    })
    describe("hear", () => {
      let vp = new Viewport()
      let path = ""
      let hash = ""
      beforeEach(() => {
        vp.hear("path", globalThis, x => path = x)
        vp.hear("hash", globalThis, x => hash = x)
      })
      test("path and hash", () => {
        vp.goTo("/some/other/path", "#hhh")
        expect(path).toBe("/some/other/path")
        expect(hash).toBe("#hhh")
      })
    })
  })
})
