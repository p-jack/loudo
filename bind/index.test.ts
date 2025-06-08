import { Ar } from "loudo-ds-array"
import { NSet } from "loudo-ds-nset"
import { loudify } from "loudify"
import { format, i18nWith, el, El } from "./index"

import { 
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  test,
} from 'vitest'

afterAll(() => {
  document.body.replaceChildren()
})

test("el", () => {
  const el1:El<"h1"> = el("h1")
  expect(el1.tag).toBe("h1")
  expect(el(el1.dom) === el1).toBe(true)
  const el2:El<"h2"> = el("h2", "inner text")
  expect(el2.tag).toBe("h2")
  expect(el2.innerText).toBe("inner text")
  const el3:El<"a"> = el("a", {href:"#foo"})
  expect(el3.tag).toBe("a")
  expect(el3.attr("href")).toBe("#foo")
  const el4:El<"a"> = el("a", "inner text", {href:"#bar"})
  expect(el4.tag).toBe("a")
  expect(el4.innerText).toBe("inner text")
  expect(el4.attr("href")).toBe("#bar")
  expect(() => { el("script") }).toThrow("not in tag whitelist")
  expect(() => { el("a", {onclick:"alert(1)"})}).toThrow("not allowing a.onclick: text event handlers are unsafe, use the .on method instead")
  expect(() => { new El(el4.dom) }).toThrow("HTMLElement already has an El attached.")
})

test("format", () => {
  expect(format("foo")).toBe("foo")
  expect(format(1111)).toBe("1,111")
  expect(format(BigInt(1111))).toBe("1,111")
  expect(format(true)).toBe("true")
  expect(format(false)).toBe("false")
  expect(format({})).toBe("[object Object]")
})

describe(".add", () => {
  test("varargs, single elements", () => {
    const div = el("div").add(el("div", "111"), el("div", "222").dom)
    expect(div.dom.childElementCount).toBe(2)
    const c1 = div.dom.children.item(0)! as HTMLElement
    expect(c1.innerText).toBe("111")
    const c2 = div.dom.children.item(1)! as HTMLElement
    expect(c2.innerText).toBe("222")
  })
  test("varargs, multiple elements", () => {
    const div = el("div").add([el("div", "111"), el("div", "222").dom])
    expect(div.dom.childElementCount).toBe(2)
    const c1 = div.dom.children.item(0)! as HTMLElement
    expect(c1.innerText).toBe("111")
    const c2 = div.dom.children.item(1)! as HTMLElement
    expect(c2.innerText).toBe("222")
  })
  test("function, multiple results", () => {
    const div = el("div").add(() => [el("div", "111"), el("div", "222")])
    expect(div.dom.childElementCount).toBe(2)
    const c1 = div.dom.children.item(0)! as HTMLElement
    expect(c1.innerText).toBe("111")
    const c2 = div.dom.children.item(1)! as HTMLElement
    expect(c2.innerText).toBe("222")
  })
  test("function, single result", () => {
    const div = el("div").add(() => el("div", "111"))
    expect(div.dom.childElementCount).toBe(1)
    const c1 = div.dom.children.item(0)! as HTMLElement
    expect(c1.innerText).toBe("111")
  })
})

describe(".animate", () => {
  test("remove child", () => {
    const model = loudify({ n:1 })
    const div = el("div").cls("foo").animate("fade-in", "fade-out")
    expect(div.appear).toBe("fade-in")
    expect(div.disappear).toBe("fade-out")
    el(document.body).animateFirst().spawn(model, "n", () => {
      if (model.n === 1) return div
      return []
    })
    expect(div.className).toBe("foo fade-in")
    model.n = 0
    expect(document.body.childElementCount).toBe(1)
    expect(div.className).toBe("foo fade-out")
    div.dom.dispatchEvent(new Event("animationend"))
    expect(div.className).toBe("foo")
    expect(document.body.childElementCount).toBe(0)
  })
  test("replace child", () => {
    const model = loudify({n:1})
    const div1 = el("div").cls("foo").animate("fade-in", "fade-out")
    const div2 = el("div").cls("bar").animate("swipe-up", "swipe-down")
    el(document.body).spawn(model, "n", n => {
      return n === 1 ? div1 : div2
    })
    expect(div1.className).toBe("foo fade-in")
    model.n = 2
    expect(document.body.childElementCount).toBe(2)
    expect(div1.className).toBe("foo fade-out")
    expect(div2.className).toBe("bar swipe-up")
    div1.dom.dispatchEvent(new Event("animationend"))
    expect(div1.className).toBe("foo")
    expect(document.body.childElementCount).toBe(1)
    div2.dom.remove()
  })
  test("automatic reversal", () => {
    const model = loudify({n:1})
    const div = el("div").animate("fade")
    expect(document.body.childElementCount).toBe(0)
    el(document.body).spawn(model, "n", () => {
      if (model.n > 0) return div
      return []
    })
    expect(document.body.childElementCount).toBe(1)
    expect(div.className).toBe("fade")
    expect(div.style.animationDirection).toBe("normal")
    model.n = 0
    expect(document.body.childElementCount).toBe(1)
    expect(div.className).toBe("fade")
    expect(div.style.animationDirection).toBe("reverse")
  })
})

describe(".attr", () => {
  let original = console.error
  let captured:any = undefined
  beforeEach(() => {
    console.error = (x:any) => { captured = x }
  })
  afterEach(() => {
    console.error = original
  })
  test("XSS: illegal tag", () => {
    const model = loudify({n:11})
    const script = document.createElement("script")
    expect(() => { el(script).attr("data-test", model, "n") }).toThrow("not allowing tag script: not in tag whitelist")
  })
  test("XSS: event handler", () => {
    const model = loudify({n:11})
    const img = el("img")
    expect(() => { img.attr("onerror", model, "n") }).toThrow("not allowing img.onerror: text event handler")
  })
  test("XSS: protocol in a URL handler", () => {
    const model = loudify({url:"javascript:alert(1)"})
    const img = el("img")
    img.attr("src", model, "url")
    expect(img.dom.getAttribute("src")).toBeNull()
    expect(captured.message).toMatch(/invalid protocol javascript/)
  })
  test("get", () => {
    const div = el("div")
    div.dom.setAttribute("data-test", "foo")
    expect(div.attr("data-test")).toBe("foo")
    expect(div.attr("missing")).toBeUndefined()
  })
  test("no binding", () => {
    const div = el("div").attr("data-test", "foo")
    expect(div.dom.getAttribute("data-test")).toBe("foo")
    div.attr("data-test", 1111)
    expect(div.dom.getAttribute("data-test")).toBe("1111")
    div.attr("data-test", true)
    expect(div.dom.getAttribute("data-test")).toBe("")
    div.attr("data-test", false)
    expect(div.dom.getAttribute("data-test")).toBeNull()
    div.attr("data-test", undefined)
    expect(div.dom.getAttribute("data-test")).toBeNull()
    div.attr({"data-test1":"foo", "data-test2":true, "data-test3":false, "data-test4":1111})
    expect(div.dom.getAttribute("data-test1")).toBe("foo")
    expect(div.dom.getAttribute("data-test2")).toBe("")
    expect(div.dom.getAttribute("data-test3")).toBeNull()
    expect(div)
  })
  test("simple binding", () => {
    const model = loudify({n:111})
    const div = el("div").attr("data-test", model, "n")
    expect(div.dom.getAttribute("data-test")).toBe("111")
    model.n = 222
    expect(div.dom.getAttribute("data-test")).toBe("222")
  })
  test("object field", () => {
    class C {
      constructor(readonly n:number) {}
      toString() { return "foo-" + String(this.n) }
    }
    const model = loudify({o:new C(111)})
    const div = el("div").attr("data-test", model, "o")
    expect(div.dom.getAttribute("data-test")).toBe("foo-111")
    model.o = new C(222)
    expect(div.dom.getAttribute("data-test")).toBe("foo-222")
  })
  test("custom translate", () => {
    const model = loudify({s:"abc"})
    const div = el("div").attr(
      "data-test",
      model,
      "s",
      s => s.toUpperCase()
    )
    expect(div.dom.getAttribute("data-test")).toBe("ABC")
    model.s = "efg"
    expect(div.dom.getAttribute("data-test")).toBe("EFG")
  })
  test("undefined value", () => {
    const model = loudify({v:undefined})
    const div = el("div").attr("data-test", model, "v")
    expect(div.dom.getAttribute("data-test")).toBeNull()
  })
})

test(".attrs", () => {
  const input1 = el("input")
  input1.dom.setAttribute("disabled", "")
  input1.attrs({ disabled:false, value:"foo" })
  expect(input1.dom.hasAttribute("disabled")).toBe(false)
  expect(input1.dom.getAttribute("value")).toBe("foo")
  const input2 = el("input")
  input2.dom.setAttribute("disabled", "")
  input2.attrs({ disabled:undefined, value:"foo" })
  expect(input2.dom.hasAttribute("disabled")).toBe(false)
  expect(input2.dom.getAttribute("value")).toBe("foo")
})

describe(".cls", () => {
  test("XSS: illegal tag", () => {
    const iframe = document.createElement("iframe")
    expect(() => { el(iframe).cls("darkmode") }).toThrow("not allowing tag iframe: not in tag whitelist")
  })
  describe("no binding", () => {
    test("no preserved", () => {
      const div = el("div").cls("foo")
      expect(div.className).toBe("foo")
      div.cls(["bar", "baz"])
      expect(div.className).toBe("bar baz")
      div.cls(new Set(["fubar", "snafu"]))
      expect(div.className).toBe("fubar snafu")
    })
    test("with preserved", () => {
      const div = el("div").cls("foo").preserve("xyzzy")
      expect(div.className).toBe("xyzzy foo")
      div.cls(["bar", "baz"])
      expect(div.className).toBe("xyzzy bar baz")
      div.cls(new Set(["fubar", "snafu"]))
      expect(div.className).toBe("xyzzy fubar snafu")
    })
  })
  describe("with binding", () => {
    test("no preserved", () => {
      const model = loudify({n:0})
      const div = el("div").cls(model, "n", () => {
        switch (model.n) {
          case 0: return []
          case 1: return "one"
          case 2: return ["11", "22"]
          default: return new Set(["111", "222", "333"])
        }
      })
      expect(div.className).toBe("")
      model.n = 1
      expect(div.className).toBe("one")
      model.n = 2
      expect(div.className).toBe("11 22")
      model.n = 3
      expect(div.className).toBe("111 222 333")  
    })
    test("with preserved", () => {
      const model = loudify({n:0})
      const div = el("div").preserve(["xyzzy"]).cls(model, "n", () => {
        switch (model.n) {
          case 0: return []
          case 1: return "one"
          case 2: return ["11", "22"]
          default: return new Set(["111", "222", "333"])
        }
      })
      expect(div.className).toBe("xyzzy")
      model.n = 1
      expect(div.className).toBe("xyzzy one")
      model.n = 2
      expect(div.className).toBe("xyzzy 11 22")
      model.n = 3
      expect(div.className).toBe("xyzzy 111 222 333")
    })
  })
})

describe(".css", () => {
  test("no binding", () => {
    const div = el("div").css({ background:"red" })
    expect(div.style.background).toBe("red")
  })
  test("with binding", () => {
    const model = loudify({flag:false})
    const h1 = el("div").css(model, "flag", flag => {
      if (flag) {
        return { background:"red" }
      } else {
        return { background:"blue"}
      }
    })
    expect(h1.style.background).toBe("blue")
    model.flag = true
    expect(h1.style.background).toBe("red")
    model.flag = false
    expect(h1.style.background).toBe("blue")
  })
})

describe(".inner", () => {
  test("XSS: illegal tag", () => {
    const model = loudify({n:11})
    const iframe = document.createElement("iframe")
    expect(() => { el(iframe).inner(model, "n") }).toThrow("not allowing tag iframe: not in tag whitelist")
  })
  test("no binding", () => {
    const h1 = el("h1").inner("hello world")
    expect(h1.innerText).toBe("hello world")
  })
  test("simple case", () => {
    const model = loudify({n:11})
    const h1 = el("h1").inner(model, "n")
    expect(h1.innerText).toBe("11")
    model.n = 22
    expect(h1.innerText).toBe("22")
  })
  describe("i18n", () => {
    afterEach(() => {
      i18nWith(s => String(s))
    })
    test("i18n", () => {
      const model = loudify({ s:"abc" })
      i18nWith(s => String(s).toUpperCase())
      const h1 = el("h1").inner(model, "s")
      expect(h1.innerText).toBe("ABC")
    })
  })
  test("xlat", () => {
    const model = loudify({n:"abc"})
    const h1 = el("h1").inner(model, "n", () => model.n.toUpperCase())
    expect(h1.innerText).toBe("ABC")
    model.n = "xyz"
    expect(h1.innerText).toBe("XYZ")
  })
})

test("isConnected", () => {
  expect(el("div").isConnected).toBe(false)
})

describe("on/off", () => {
  describe("function", () => {
    test("simple", () => {
      let clicked = 0
      const ear = () => { clicked++ }
      const div = el("div").on("click", ear)
      document.body.appendChild(div.dom)
      div.dom.dispatchEvent(new Event("click"))
      expect(clicked).toBe(1)
      expect(div.off("click", ear) === div).toBe(true)
      div.dom.dispatchEvent(new Event("click"))
      expect(clicked).toBe(1)
    })
    test("duplicate", () => {
      let clicked = 0
      const ear = () => { clicked++ }
      expect(() => { el("div").on("click", ear).on("click", ear) }).toThrow("duplicate event handler: click")
    })
    test("report", () => {
      let error = undefined
      let event = ""
      const div = el("div").on("click", () => { throw "error" }, { report:(e,evt) => {
        error = e
        event = evt.type
      }})
      div.dom.dispatchEvent(new Event("click"))
      expect(error).toBe("error")
      expect(event).toBe("click")
    })  
  })
  describe("handler object", () => {
    test("simple", () => {
      let clicked = 0
      const ear = { handleEvent:() => { clicked++ } }
      const div = el("div").on("click", ear)
      document.body.appendChild(div.dom)
      div.dom.dispatchEvent(new Event("click"))
      expect(clicked).toBe(1)
      expect(div.off("click", ear) === div).toBe(true)
      div.dom.dispatchEvent(new Event("click"))
      expect(clicked).toBe(1)
    })
    test("duplicate", () => {
      let clicked = 0
      const ear = { handleEvent:() => { clicked++ } }
      expect(() => { el("div").on("click", ear).on("click", ear) }).toThrow("duplicate event handler: click")
    })
    test("report", () => {
      let error = undefined
      let event = ""
      const ear = { handleEvent:() => { throw "error" } }
      const div = el("div").on("click", ear, { report:(e,evt) => {
        error = e
        event = evt.type
      }})
      div.dom.dispatchEvent(new Event("click"))
      expect(error).toBe("error")
      expect(event).toBe("click")
    })
  })
  test("no listeners", () => {
    const nop = () => {}
    const div = el("div")
    expect(div.off("click", nop) === div).toBe(true)
  })
  test("wrong listener", () => {
    const nop = () => {}
    const div = el("div").on("click", nop)
    expect(div.off("blur", nop) === div).toBe(true)
  })
})

test(".preserve", () => {
  const div = el("div").preserve("foo")
  expect(div.className).toBe("foo")
  div.preserve(["bar", "baz"])
  expect(div.className).toBe("bar baz")
})

test("query", () => {
  const p = el("p")
  const div = el("div").add(p)
  expect(div.query("p")).toBe(p)
  expect(div.query("a")).toBeUndefined()
})

test("queryAll", () => {
  const p1 = el("p")
  const p2 = el("p")
  const div = el("div").add([p1, p2])
  expect(div.queryAll("p")).toStrictEqual([p1, p2])
})

function inner(elem:Node|null) {
  if (elem instanceof HTMLElement) return elem.innerText
  return ""
}

describe(".spawn", () => {
  describe("loud object", () => {
    const modelSample = loudify({n:0})
    type M = typeof modelSample
    function factory(n:number) {
      return el(n % 2 === 0 ? "h2" : "h1")
    }
    test("XSS: illegal tag", () => {
      const model = loudify({n:11})
      const script = document.createElement("script")
      expect(() => { el(script).spawn(model, "n", factory) }).toThrow("not allowing tag script: not in tag whitelist")
    })
    test("simple case", () => {
      const model = loudify({n:11})
      const div = el("div").spawn(model, "n", factory)
      expect(div.dom.children.item(0)?.tagName).toBe("H1")
      model.n = 2222
      expect(div.dom.children.item(0)?.tagName).toBe("H2")
    })
    test("multiple children", () => {
      function factory(n:number) {
        const result:El<"div">[] = []
        for (let i = 0; i < n; i++) {
          result.push(el("div"))
        }
        return result
      }
      const model = loudify({ n: 1 })
      const div = el("div").spawn(model, "n", factory)
      expect(div.dom.children.length).toBe(1)
      model.n = 2
      expect(div.dom.children.length).toBe(2)
    })
    test("function that produces a single result", () => {
      const model = loudify({ n: 11 })
      const div = el("div")
      div.spawn(model, "n", () => {
        return () => {
          const r = el("p")
          r.innerText = String(model.n)
          return r
        }
      })
      expect(div.dom.children.length).toBe(1)
      let child = div.dom.children.item(0)! as HTMLElement
      expect(child.innerText).toBe("11")
      model.n = 22
      expect(div.dom.children.length).toBe(1)
      child = div.dom.children.item(0)! as HTMLElement
      expect(child.innerText).toBe("22")
    })
    test("function that produces multiple children", () => {
      const model = loudify({ n: 1 })
      const div = el("div")
      div.spawn(model, "n", () => {
        return () => {
          const r:El<any>[] = []
          for (let i = 0; i < model.n; i++) {
            r.push(el("p"))
          }
          return r
        }
      })
      expect(div.dom.children.length).toBe(1)
      model.n = 2
      expect(div.dom.children.length).toBe(2)
      model.n = 0
      expect(div.dom.children.length).toBe(0)
    })
    test("KEEP", () => {
      let isEven:boolean|undefined = undefined
      function factory(n:number) {
        const even = n % 2 === 0
        if (even === isEven) return "KEEP"
        isEven = even
        return el(even ? "h2" : "h1")
      }
      const model = loudify({ n: 1 })
      const div = el("div").spawn(model, "n", factory)
      const first = div.dom.children.item(0)!
      expect(first.tagName).toBe("H1")
      model.n = 1111
      expect(div.dom.children.item(0)).toBe(first)
      model.n = 2222
      expect(div.dom.children.item(0)).not.toBe(first)
    })
    test("undefined", () => {
      const model = loudify({ n:1 })
      const div = el("div").spawn(model, "n", n => {
        if (n === 0) return undefined
        return el("p").inner(String(n))
      })
      expect(div.dom.children.length).toBe(1)
      expect(inner(div.dom.children.item(0))).toBe("1")
      model.n = 0
      expect(div.dom.children.length).toBe(0)
    })
  })
  describe("loud array", () => {
    const stork = (s:string) => {
      if (s === "22" || s === "ZZ") {
        const p = document.createElement("p")
        p.innerText = s
        return p
      } else {
        return el("p", s)
      }
    }
    let a = Ar.of("11", "22", "33")
    let div = el("div").spawn(a, stork)
    beforeEach(() => {
      a = Ar.of("11", "22", "33")
      div = el("div").spawn(a, stork)
    })
    test("initial children", () => {
      expect(div.dom.children.length).toBe(3)
      expect(inner(div.dom.children.item(0))).toBe("11")
      expect(inner(div.dom.children.item(1))).toBe("22")
      expect(inner(div.dom.children.item(2))).toBe("33")
    })
    test("clear", () => {
      a.clear()
      expect(div.dom.children.length).toBe(0)
    })
    test("reverse", () => {
      a.reverse()
      expect(div.dom.children.length).toBe(3)
      expect(inner(div.dom.children.item(0))).toBe("33")
      expect(inner(div.dom.children.item(1))).toBe("22")
      expect(inner(div.dom.children.item(2))).toBe("11")
    })
    test("remove", () => {
      a.removeAt(1)
      expect(div.dom.children.length).toBe(2)
      expect(inner(div.dom.children.item(0))).toBe("11")
      expect(inner(div.dom.children.item(1))).toBe("33")
    })
    test("add", () => {
      a.add("ZZ", 1)
      expect(div.dom.children.length).toBe(4)
      expect(inner(div.dom.children.item(0))).toBe("11")
      expect(inner(div.dom.children.item(1))).toBe("ZZ")
      expect(inner(div.dom.children.item(2))).toBe("22")
      expect(inner(div.dom.children.item(3))).toBe("33")
      a.add("YY", 2)
      expect(div.dom.children.length).toBe(5)
      expect(inner(div.dom.children.item(0))).toBe("11")
      expect(inner(div.dom.children.item(1))).toBe("ZZ")
      expect(inner(div.dom.children.item(2))).toBe("YY")
      expect(inner(div.dom.children.item(3))).toBe("22")
      expect(inner(div.dom.children.item(4))).toBe("33")
    })
  })
  describe("loud non-array", () => {
    const stork = (s:string) => el("p", s)
    let c = NSet.of("11", "22", "33")
    let div = el("div").spawn(c, stork)
    beforeEach(() => {
      c = NSet.of("11", "22", "33")
      div = el("div").spawn(c, stork)  
    })
    test("initial children", () => {
      expect(inner(div.dom.children.item(0))).toBe("11")
      expect(inner(div.dom.children.item(1))).toBe("22")
      expect(inner(div.dom.children.item(2))).toBe("33")    
    })
  })

  test(".value", () => {
    expect(el("p").value).toBe("")
    expect(el("input").attr("value", "xyzzy").value).toBe("xyzzy")
  })
})
