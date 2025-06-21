import { El, el } from "loudo-bind"

const style = document.createElement("style")
style.id = "loudo-styled"
document.head.appendChild(style)

let log = false
export function setLog(on:boolean) {
  log = on
}

export type Part = string|ElMaker<any>

function insert(rule:string) {
  const sheet = style.sheet
  /* v8 ignore next */
  if (sheet === null) throw new StyleError("unavailable")
  const r = sheet.insertRule(rule, sheet.cssRules.length)
  if (log) {
    console.debug("loudo-styled input: " + rule)
    const inserted = sheet.cssRules[r]
    console.debug("loudo-styled output: " + inserted?.cssText)
  }
}

export class StyleError extends Error {}

export type A = Record<string,string|undefined>
export type H = HTMLElementTagNameMap
export type TSA = TemplateStringsArray

let clazz = 0

export function clear() {
  clazz = 0
  const sheet = style?.sheet
  /* v8 ignore next */
  if (sheet === null) return
  while (sheet.cssRules.length > 0) {
    sheet.deleteRule(0)
  }
}

export const autoName = (tag:string):string => {
  clazz++
  return tag + "-" + clazz
}

export function nextSuffix() {
  clazz++
  return clazz
}

export interface ElMaker<K extends keyof H> {
  (innerText?:string, attributes?:A):El<K>
  className:string // does NOT include leading dot
  with(first:Part, ...parts:Part[]):(css:TSA)=>void
  media(first:Part, ...parts:Part[]):(css:TSA)=>void
}

export type CSSMaker<K extends keyof H> = (css:TSA)=>ElMaker<K>

export function styled<K extends keyof H>(tag:K):CSSMaker<K>
export function styled<K extends keyof H>(tag:K, name:string):CSSMaker<K>
export function styled<K extends keyof H>(tag:K, name?:string):CSSMaker<K> {
  const className = name === undefined ? autoName(tag) : autoName(name)
  return css => {
    const rule = "." + className + " { " + css.join("") + " } "
    insert(rule)
    const result = (innerText:string = "", attributes:A = {}) => {
      return el(tag).preserve(className).inner(innerText).attrs(attributes)
    }
    result.className = className
    result.with = (first:Part, ...parts:Part[]):(css:TSA)=>void => {
      return (css) => {
        const rule = "." + className + selector(first, parts) + " { " + css.join("") + "}"
        insert(rule)
      }
    }
    result.media = (query:string, ...parts:Part[]):(css:TSA)=>void => {
      return (css) => {
        const rule = `@media (${query}) {
          .${className}${selector("", parts)} {
            ${css.join("")}
          }
        }`
        insert(rule)
      }
    }
    return result  
  }
}


function selector(first:Part, parts:Part[]) {
  const all = [first, ...parts].map(x => typeof x === "string" ? x : "." + x.className)
  return all.join("")
}

export function addRule(first:Part, ...parts:Part[]):(css:TSA)=>void {
  const s = selector(first, parts)
  return css => insert(s + " { " + css.join("") + "}")
}

export function media(query:string, first:Part, ...parts:Part[]):(css:TSA)=>void {
  const s = selector(first, parts)
  const rule = `@media (${query}) { ${s} {`
  console.log("rule", rule)
  return css => insert(`@media (${query}) { ${s} { ${css.join("")} }}`)
}

export function keyframed():(animation:TSA)=>(keyframes:TSA)=>string {
  return animation => {
    const tokens = animation.join("").trim().split(" ")
    const name = tokens[tokens.length - 1]!
    if (name.length === 0) throw new StyleError("invalid animation: " + animation)
    const fullName = autoName(name)
    tokens[tokens.length - 1] = fullName
    const fullAnim = tokens.join(" ")
    return keyframes => {
      const kfRule = `@keyframes ${fullName} {${keyframes.join("")}}`
      insert(kfRule)
      const clazz = `.${fullName} { animation: ${fullAnim}; }`
      insert(clazz)
      return fullName
    }
  }
}

export function keyframed2():(animation:TSA)=>(keyframes:TSA)=>[string, string] {
  return animation => {
    const tokens = animation.join("").trim().split(" ")
    const name = tokens[tokens.length - 1]!
    if (name.length === 0) throw new StyleError("invalid animation: " + animation)
    const fullName = autoName(name)
    tokens[tokens.length - 1] = fullName
    const fullAnim = tokens.join(" ")
    return keyframes => {
      const kfRule = `@keyframes ${fullName} {${keyframes.join("")}}`
      insert(kfRule)
      const clazz = `.${fullName} { animation: forwards ${fullAnim}; }`
      insert(clazz)
      const clazzB = `.${fullName}-b { animation: backwards ${fullAnim}-b; }`
      insert(clazzB)
      return [fullName, fullName + "-b"]
    }
  }
}
