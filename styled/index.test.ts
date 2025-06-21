import { afterEach, test, expect, describe, beforeEach } from "vitest"
import { styled, addRule, nextSuffix, clear, setLog, keyframed, media, keyframed2, setVar, getVar, setPlaceholder } from "./index"

function style() {
  return document.getElementById("loudo-styled") as HTMLStyleElement
}

function firstRule() {
  return style()?.sheet?.cssRules[0]?.cssText?.replaceAll("\n", "")
}

function ruleAt(i:number) {
  return style()?.sheet?.cssRules[i]?.cssText?.replaceAll("\n", "")
}

function lastRule() {
  const rules = style()?.sheet?.cssRules
  if (rules === undefined) return undefined
  return rules[rules.length - 1]?.cssText?.replaceAll("\n", "")
}

afterEach(()=>{
  clear()
})

test("automatically adds a <style> to document head", () => {
  nextSuffix()
  expect(style()).not.toBeNull()
})

describe("styled", () => {
  test("tag-based name", () => {
    const div = styled("div")`border: none;`
    expect(div.className).toBe("div-1")
    expect(div().className).toBe("div-1")
    expect(firstRule()).toBe(".div-1 {border: none;}")
    const div2 = styled("div")``
    expect(div2.className).toBe("div-2")
  })
  test("specific name", () => {
    const div = styled("div", "foo")`border: none;`
    expect(div.className).toBe("foo-1")
    expect(div().className).toBe("foo-1")
    expect(firstRule()).toBe(".foo-1 {border: none;}")
  })
})

test("addRule", () => {
  addRule("body")`background: black`
  expect(firstRule()).toBe("body {background: black;}")
})

test("innerText", () => {
  const p = styled("p")``
  const elem = p("baz")
  expect(elem.innerText).toBe("baz")
})

test("attributes", () => {
  const input = styled("input")`font-color:red`
  const elem = input("", {type:"email", "data-test":"test"})
  expect(elem.attr("type")).toBe("email")
  expect(elem.attr("data-test")).toBe("test")
})

describe("log", () => {
  const orig = console.debug
  let captured:string[] = []
  beforeEach(() => {
    setLog(true)
    console.debug = (s:string) => { captured.push(s) }
  })
  afterEach(() => {
    console.debug = orig
    setLog(false)
  })
  test("log", () => {
    styled("div")`border:none`
    expect(captured).toStrictEqual([
      "loudo-styled input: .div-1 { border:none } ",
      "loudo-styled output: .div-1 {border: none;}",
    ])
  })
})

describe(".with", () => {
  test("string selector", () => {
    const div = styled("div")`color:black;`
    div.with(".dark")`color:white`
    expect(lastRule()).toBe(".div-1.dark {color: white;}")
  })
  test("el selector", () => {
    const div1 = styled("div")`color:black;`
    const div2 = styled("div")`color:white;`
    div1.with(div2)`color:blue;`
    expect(lastRule()).toBe(".div-1.div-2 {color: blue;}")
  })
  test("many parts", () => {
    const div1 = styled("div")`color:black;`
    const div2 = styled("div")`color:white;`
    div1.with(div2, " h1")`color:blue;`
    expect(lastRule()).toBe(".div-1.div-2 h1 {color: blue;}")
  })
})

describe(".media", () => {
  test("no selectors", () => {
    const div1 = styled("div")`color:black`
    div1.media("hover:hover")`color:white`
    expect(lastRule()).toBe("@media (hover:hover) {.div-1 {color: white;}}")
  })
  test("string selector", () => {
    const div1 = styled("div")`color:black`
    div1.media("hover:hover", ".dark")`color:white`
    expect(lastRule()).toBe("@media (hover:hover) {.div-1.dark {color: white;}}")
  })
  test("el selector", () => {
    const div1 = styled("div")`color:black;`
    const div2 = styled("div")`color:white;`
    div1.media("hover:hover", div2)`color:blue`
    expect(lastRule()).toBe("@media (hover:hover) {.div-1.div-2 {color: blue;}}")
  })
  test("many selectors", () => {
    const div1 = styled("div")`color:black;`
    const div2 = styled("div")`color:white;`
    div1.media("hover:hover", div2, " h1")`color:blue`
    expect(lastRule()).toBe("@media (hover:hover) {.div-1.div-2 h1 {color: blue;}}")
  })
})

describe("media", () => {
  test("string selector", () => {
    media("hover:hover", ".dark")`color:white`
    expect(lastRule()).toBe("@media (hover:hover) {.dark {color: white;}}")
  })
  test("el selector", () => {
    const div1 = styled("div")`color:black;`
    media("hover:hover", div1)`color:blue`
    expect(lastRule()).toBe("@media (hover:hover) {.div-1 {color: blue;}}")
  })
  test("many selectors", () => {
    const div1 = styled("div")`color:black;`
    media("hover:hover", div1, " h1")`color:blue`
    expect(lastRule()).toBe("@media (hover:hover) {.div-1 h1 {color: blue;}}")
  })
})

test("keyframed", () => {
  keyframed()`1s ease-out fadeOut`
  `from{opacity:0}to{opacity:1}`
  expect(firstRule()).toBe("@keyframes fadeOut-1 {   from {opacity: 0;}   to {opacity: 1;} }")
  expect(lastRule()).toBe(".fadeOut-1 {animation: 1s ease-out fadeOut-1;}")
  expect(() => { keyframed()```` }).toThrow("invalid animation")
})

test("keyframed2", () => {
  keyframed2()`1s ease-out fadeOut`
  `from{opacity:0}to{opacity:1}`
  expect(firstRule()).toBe("@keyframes fadeOut-1 {   from {opacity: 0;}   to {opacity: 1;} }")  
  expect(ruleAt(1)).toBe(".fadeOut-1 {animation: forwards 1s ease-out fadeOut-1;}")
  expect(lastRule()).toBe(".fadeOut-1-b {animation: backwards 1s ease-out fadeOut-1-b;}")
  expect(() => { keyframed2()```` }).toThrow("invalid animation")
})

describe("setVar", () => {
  setPlaceholder(new URL("https://example.com"))
  const b = document.body
  const orig = console.error
  let captured:string[] = []
  beforeEach(() => {
    captured = []
    console.error = (s:string) => { captured.push(s) }
  })
  afterEach(() => {
    console.error = orig
  })
  test("good", () => {
    setVar(b, "--var", "#123")
    expect(getVar(b, "--var")).toBe("#123")
    setVar(b, "--var", 123)
    expect(getVar(b, "--var")).toBe("123px")
    setVar(b, "--var", "https://foo.com")
    expect(getVar(b, "--var")).toBe("https://foo.com/")
    setVar(b, "--var", new URL("https://foo.com"))
    expect(getVar(b, "--var")).toBe("https://foo.com/")
    setVar(b, "--var", "http://localhost:3000/foo/bar")
    expect(getVar(b, "--var")).toBe("http://localhost:3000/foo/bar")
    expect(captured).toStrictEqual([])
  })
  test("bad", () => {
    setVar(document.body, "--var", "javascript://alert(1)")
    expect(captured).toStrictEqual(["XSS: invalid url protocol"])
    expect(getVar(document.body, "--var")).toBe("https://example.com/")
  })
})