import { ArrayBase } from "loudo-ds-array-interfaces"
import { LEvent, Loud as LoudDS } from "loudo-ds-core"
import { mixed } from "loudo-mixin"
import { Loud } from "loudify"
import { XSSWhitelist, XSSWhitelistError } from "xss-whitelist"


//// Global types

export type Keys<T extends object> = keyof T | readonly (keyof T)[]
export type Primitive = string|number|boolean|bigint


//// el

const sym = Symbol("el")

export function el<K extends keyof HTMLElementTagNameMap>(elem:HTMLElementTagNameMap[K]):El<K>
export function el<K extends keyof HTMLElementTagNameMap>(tag:K):El<K>
export function el<K extends keyof HTMLElementTagNameMap>(tag:K, attrs:Record<string,string|undefined>):El<K>
export function el<K extends keyof HTMLElementTagNameMap>(tag:K, innerText:string):El<K>
export function el<K extends keyof HTMLElementTagNameMap>(tag:K, innerText:string, attrs:Record<string,string|undefined>):El<K>

export function el<K extends keyof HTMLElementTagNameMap>
(tag:K|HTMLElement, attributesOrInnerText:Record<string,string|undefined>|string = {}, attrs?:Record<string,string|undefined>) {
  if (tag instanceof HTMLElement) {
    const o = tag as any
    if (sym in o) return o[sym]
    const el = new El(o)
    return el
  }
  XSSWhitelist.raise(tag)
  const result = new El(document.createElement(tag))
  if (typeof(attributesOrInnerText) === "string") {
    result.inner(attributesOrInnerText)
    result.attrs(attrs ?? {})
  } else {
    result.attrs(attributesOrInnerText)
  }
  return result
}


//// El

interface Anim {
  appear: string
  disappear: string
  auto: boolean
}

export type Classes = string|Iterable<string>
export type School<T> = (v:T)=>Classes

export type Salon<T> = (v:T)=>Partial<CSSStyleDeclaration>

export type Child = HTMLElement|El<any>|SVGSVGElement|undefined
export type Children = Child|Iterable<Child>|(()=>Child)|(()=>Iterable<Child>)
export type Stork<T> = (value:T)=>Children|"KEEP"

type EventName = keyof HTMLElementEventMap
//export const REMOVE = "loudo-remove"
export type Handler = ((event:Event)=>void)|EventListenerObject
export type Report = (error:any, event:Event)=>void
export interface Options {
  capture?:boolean
  passive?:boolean
  report?:Report
}

export class El<T extends keyof HTMLElementTagNameMap> {

  static debug = false

  readonly tag:T
  readonly preserved = new Set<string>

  constructor(readonly dom:HTMLElementTagNameMap[T]) {
    if (sym in dom) throw new Error("HTMLElement already has an El attached.")
    this.tag = dom.tagName.toLowerCase() as never
    XSSWhitelist.raise(this.tag);
    (dom as any)[sym] = this
  }

  private anim:Anim = { appear:"", disappear:"", auto:false }
  private handlers:Handlers|undefined
  private spawns = 0
  private afirst = false

  get classList() { return this.dom.classList }
  get className() { return this.dom.className }
  get innerText() { return this.dom.innerText }
  set innerText(s:Primitive) { this.dom.innerText = format(s) }
  get isConnected() { return this.dom.isConnected }
  get style() { return this.dom.style }
  get appear() { return this.anim.appear }
  get disappear() { return this.anim.disappear }

  add(...children:Children[]) {
    for (const x of children.map(x => arrayize(x)).flat()) {
      this.dom.appendChild(x)
    }
    return this
  }

  animate(appear:string, disappear?:string):this {
    this.anim = { auto: disappear === undefined, appear, disappear: disappear ?? appear }
    return this
  }

  animateFirst():this {
    this.afirst = true
    return this
  }

  attr(attribute:string):string|undefined
  attr(attribute:string, value:Primitive|undefined):this
  attr(attributes:Record<string,Primitive|undefined>):this
  attr<T extends Loud,K extends keyof T>(attribute:string, model:T, key:K, xlat?:(x:T[K])=>string|boolean|undefined):this
  attr<T extends Loud,K extends keyof T>(attribute:string|Record<string,Primitive|undefined>, model?:T|Primitive, key?:K, xlat?:(x:T[K])=>string):this|string|undefined {
    const elem = this.dom
    const tag = this.tag
    if (typeof(attribute) === "object") {
      for (const k in attribute) attr(elem, k, attribute[k]!)
      return this
    }
    if (attribute.startsWith("on")) {
      throw new XSSWhitelistError(tag, attribute, `text event handlers are unsafe, use the .on method instead`)
    }
    if (model === undefined) {
      const a = elem.getAttribute(attribute)
      return a === null ? undefined : a
    }
    if (typeof(model) !== "object") {
      attr(elem, attribute, model)
      return this
    }
    /* v8 ignore next */
    if (key === undefined) return this
    const ear = () => {
      const v = valueFor(model, key, xlat)
      if (typeof(v) === "string") try {
        XSSWhitelist.raise(tag as never, attribute, v)
      } catch (e) {
        console.error(e)
        return
      }
      attr(elem, attribute, v)
    }
    model.hear(key, this, ear)
    return this  
  }

  attrs(changes:Record<string,Primitive|undefined>):this {
    for (const k in changes) {
      const v = changes[k]
      if (v === undefined) this.dom.removeAttribute(k)
      else this.attr(k, v)
    }
    return this
  }

  cls(list:Classes):this
  cls<T extends Loud,K extends keyof T>(model:T, key:K, school:School<T[K]>):this
  cls<T extends Loud,K extends keyof T>(model:T|Classes, key?:K, school?:School<T[K]>):this {
    const elem = this.dom
    const preserve = this.preserved
    if (typeof(model) === "string") {
      cls(elem, preserve, model.split(" "))
      return this
    }
    if (typeof(model) === "object" && !("hear" in model)) {
      cls(elem, preserve, model)
      return this
    }
    /* v8 ignore next */
    if (school === undefined) return this
    const ear = () => { cls(elem, preserve, school(model[key!])) }
    model.hear(key!, this, ear)
    return this
  }

  css(style:Partial<CSSStyleDeclaration>):this
  css<T extends Loud,K extends keyof T>(model:T, key:K, salon:Salon<T[K]>):this
  css<T extends Loud,K extends keyof T>(model:T|Partial<CSSStyleDeclaration>, key?:K, salon?:Salon<T[K]>) {
    const elem = this.dom
    if (!("hear" in model)) {
      Object.assign(elem.style, model)
      return this
    }
    /* v8 ignore next */
    if (salon === undefined) return this
    const ear = () => {
      const newCSS = salon(model[key!])
      Object.assign(elem.style, newCSS)
    }
    model.hear(key!, this, ear)
    return this  
  }

  inner(text:Primitive):this
  inner<T extends Loud,K extends keyof T>(model:T, key:K, xlat?:(model:T[K])=>string):this
  inner<T extends Loud,K extends keyof T>(model:T|Primitive, key?:K, xlat?:(model:T[K])=>string) {
    const elem = this.dom
    if (typeof(model) !== "object") {
      elem.innerText = format(model)
      return this
    }
    /* v8 ignore next */
    if (key === undefined) return this
    const ear = () => { elem.innerText = xlat ? xlat(model[key]) : format(model[key]) }
    model.hear(key, this, ear)
    return this  
  }

  on(event:keyof HTMLElementEventMap, handler:Handler, options:Options = {}):this {
    if (this.handlers === undefined) {
      this.handlers = new Handlers()
    }
    const wrap = this.handlers.add(event, handler, options)
    this.dom.addEventListener(event, wrap.wrapped, options)
    return this
  }

  off(event: keyof HTMLElementEventMap, handler:Handler):this {
    if (this.handlers === undefined) return this
    const wrap = this.handlers.remove(event, handler)
    if (wrap === undefined) return this
    this.dom.removeEventListener(event, wrap.wrapped, wrap.options)
    return this
  }

  preserve(classes:Classes):this {
    for (const x of this.preserved) {
      this.preserved.delete(x)
      this.classList.remove(x)
    }
    if (typeof(classes) === "string") classes = classes.split(" ") 
    for (const x of classes) {
      this.preserved.add(x)
    }
    const set = new Set(this.preserved)
    const cl = this.dom.classList
    for (let i = 0; i < cl.length; i++) {
      set.add(cl[i]!)
    }
    this.dom.className = ""
    for (const x of set) {
      this.dom.classList.add(x)
    }
    return this
  }

  query(selector:string) {
    const r = this.dom.querySelector(selector)
    return r instanceof HTMLElement ? el(r) : undefined
  }

  queryAll(selector:string) {
    const r = this.dom.querySelectorAll(selector)
    const a:El<keyof HTMLElementTagNameMap>[] = []
    for (let i = 0; i < r.length; i++) {
      const x = r.item(i)
      if (x instanceof HTMLElement) a.push(el(x))
    }
    return a
  }

  private doAppear():boolean {
    const elem = this.dom
    const anim = this.anim
    if (anim.appear === "") return false
    if (anim.auto) elem.style.animationDirection = "normal"
    elem.classList.add(anim.appear)
    return true
  }
  
  private doDisappear():boolean {
    const elem = this.dom
    const anim = this.anim
    if (anim.disappear === "") return false
    const ear = () => {
      elem.removeEventListener("animationend", ear)
      elem.removeEventListener("animationcancel", ear)
      elem.remove()
      elem.classList.remove(anim.disappear)
    }
    elem.addEventListener("animationend", ear)
    elem.addEventListener("animationcancel", ear)
    if (anim.auto) elem.style.animationDirection = "reverse"
    elem.classList.remove(anim.appear)
    void elem.offsetWidth; // TODO triggers re-render
    elem.classList.add(anim.disappear)
    return true
  }
  
  get first() {
    const r = this.dom.children.item(0)
    if (r instanceof HTMLElement) return r
    return undefined
  }
  
  private spawnModel<T extends Loud,K extends keyof T>(model:T, key:K, stork:Stork<T[K]>) {
    const elem = this.dom
    const children = stork(model[key])
    this.spawns++
    if (children === "KEEP") return
    const r = arrayize(children)
    if (r.length > 1 || elem.childElementCount > 1) {
      elem.replaceChildren(...r)
      return
    }
    const outgoing = this.first
    const animating = outgoing ? el(outgoing).doDisappear() : false
    if (r.length === 1) {
      const child = r[0]!
      console.log("spawns:", this.spawns, "afirst:", this.afirst, "this", this.tag)
      if (child instanceof HTMLElement && (this.spawns > 1 || this.afirst)) el(child).doAppear()
      if (animating) {
        elem.appendChild(child)
      } else {
        elem.replaceChildren(child)
      }
    } else {
      if (!animating) {
        elem.replaceChildren(...r)
      }
    }
  }

  private spawnA<X extends {}>(a:ArrayBase<X>&LoudDS<X>, stork:(x:X)=>Child) {
    const dom = this.dom
    const children = this.dom.children
    const ear = (event:LEvent<X>) => {
      if (event.cleared) {
        const list:(HTMLElement|SVGSVGElement|El<any>)[] = []
        for (const x of event.added?.elements ?? []) {
          const c = stork(x)
          if (c) list.push(c)
        }
        dom.replaceChildren(...arrayize(list))
        return
      }
      if (event.removed) {
        const {elements, at} = event.removed
        for (let i = 0; i < elements.size; i++) {
          dom.children.item(at)?.remove()
        }
      }
      if (event.added) {
        const { at, elements } = event.added
        if (at === dom.childElementCount) for (const x of elements) {
          const child = stork(x)
          const elem = child instanceof El ? child.dom : child
          dom.appendChild(elem)
        } else for (const x of elements) {
          const node = children.item(at)
          const child = stork(x)
          const elem = child instanceof El ? child.dom : child
          dom.insertBefore(elem, node)
        }
      }
    }
    a.hear(this, ear)
  }

  private spawnDS<X extends {}>(ds:LoudDS<X>, stork:(x:X)=>Child) {
    const ear = () => {
      const a:(HTMLElement|SVGSVGElement|El<any>)[] = []
      for (const x of ds) {
        const child = stork(x)
        if (child) a.push(child)
      }
      this.dom.replaceChildren(...arrayize(a))
    }
    ds.hear(this, ear)
  }

  spawn<L extends Loud,K extends keyof L>(model:L, key:K, stork:Stork<L[K]>):this
  spawn<Y extends {}>(a:ArrayBase<Y>&LoudDS<Y>, stork:(x:Y)=>Child|undefined):this
  spawn<X extends {}>(ds:LoudDS<X>, stork:(x:X)=>Child|undefined):this
  spawn<L extends Loud,K extends keyof L,X extends {}>(p1:L|LoudDS<X>|ArrayBase<X>&LoudDS<X>, p2:K|((x:X)=>Child|undefined), p3?:Stork<L[K]>):this {
    if (mixed(p1, LoudDS)) {
      if (mixed(p1, ArrayBase)) {
        this.spawnA(p1 as never, p2 as never)
      } else {
        this.spawnDS(p1 as never, p2 as never)
      }
      return this
    }
    const model = p1 as L, stork = p3!
    const key = p2 as K
    const elem = this.dom
    const ear = () => { el(elem).spawnModel(model, key, stork) }
    model.hear(key, this, ear)
    return this
  }

  get value():string {
    return this.dom instanceof HTMLInputElement ? this.dom.value : ""
  }

}


interface Wrap {
  options: Options
  wrapped: (event:Event)=>void
}

class Handlers {

  private readonly handlers = new Map<EventName,Map<Handler,Wrap>>()

  private mapFor(name:EventName) {
    let r = this.handlers.get(name)
    if (r === undefined) {
      r = new Map<Handler,Wrap>()
      this.handlers.set(name, r)
    }
    return r
  }

  private has(name:EventName, handler:Handler) {
    let m = this.handlers.get(name)
    if (m === undefined) return false
    return m.has(handler)
  }

  add(name:EventName, handler:Handler, options:Options):Wrap {
    if (this.has(name, handler)) throw new Error("duplicate event handler: " + name)
    const result = wrap(handler, options)
    this.mapFor(name).set(handler, result)
    return result
  }

  remove(name:EventName, handler:Handler) {
    if (!this.has(name, handler)) return undefined
    const m = this.mapFor(name)
    const r = m.get(handler)
    m.delete(handler)
    return r
  }

}

//// Formatting

let i18n = (value:string):string => {
  return String(value)
}

export const i18nWith = (internationalizer:(text:string)=>string) => {
  i18n = internationalizer
}

export function format(v:unknown) {
  if (typeof(v) === "string") return i18n(v)
  if (typeof(v) === "number") return v.toLocaleString()
  if (typeof(v) === "boolean") return i18n(v ? "true" : "false")
  if (typeof(v) === "bigint") return v.toLocaleString()
  return i18n(String(v))
}


//// Plumbing

function valueFor<T extends Loud,K extends keyof T>(model:T, key:K, xlat?:(x:T[K])=>string|boolean):string|boolean|undefined {
  if (xlat) return xlat(model[key])
  const v = model[key]
  if (v === undefined) return undefined
  if (typeof(v) === "boolean" || typeof(v) === "string") return v
  return String(v)
}

function attr(elem:HTMLElement, a:string, v:Primitive|undefined) {
  if (v === undefined) {
    elem.removeAttribute(a)
    return
  }
  if (typeof(v) === "boolean") {
    if (v) elem.setAttribute(a, "")
    else elem.removeAttribute(a)
    return
  }
  if (typeof(v) === "string") {
    elem.setAttribute(a, v)
    return
  }
  elem.setAttribute(a, String(v))
}

function cls(element:HTMLElement, preserve:Set<string>, classes:Classes) {
  const set = classes instanceof Set ? classes : Array.isArray(classes) ? new Set(classes) : new Set([classes])
  element.className = ""
  for (const x of preserve) {
    element.classList.add(x)
  }
  for (const x of set) {
    element.classList.add(x)
  }
}

function arrayize(children:Children):Element[] {
  if (typeof(children) === "function") {
    children = children()
  }
  if (children === undefined) return []
  if (children instanceof Element) {
    return [children]
  }
  if (children instanceof El) {
    return [children.dom]
  }
  const result:Element[] = []
  for (const child of children) {
    if (child instanceof Element) { result.push(child) }
    else if (child instanceof El) { result.push(child.dom) }
  }
  return result
}

/* v8 ignore next */
const nop = () => {}

function wrapObject(handler:EventListenerObject, options:Options) {
  const report = options.report ?? nop
  return {
    wrapped: (event:Event) => {
      try {
        handler.handleEvent(event)
      } catch (e) {
        console.error("event handler error", event, e)
        report(e, event)
      }
    },
    options: options,
  }
}

function wrapFunction(handler:(event:Event)=>void, options:Options) {
  const report = options.report ?? nop
  return {
    wrapped:(event:Event) => {
      try {
        handler(event)
      } catch (e) {
        console.error("event handler error", event, e)
        report(e, event)
      }
    },
    options: options,
  }
}

function wrap(h:Handler, o:Options):Wrap {
  return typeof(h) === "function" ? wrapFunction(h, o) : wrapObject(h, o)
}
