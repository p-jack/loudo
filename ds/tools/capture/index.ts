import { LEvent, Mod as ModI, Loud } from "loudo-ds-core"

export interface Mod<T extends {}> {
  elements:T[]
  at?:number
}

export interface Evt<T extends {}> {
  cleared?: number
  added?: Mod<T>
  removed?: Mod<T>
}

export interface Capture<T extends {}> {
  get():Evt<T>|undefined
}

function mod<T extends {}>(mod?:ModI<T>):Mod<T>|undefined {
  if (mod === undefined) return undefined
  const at = mod.at
  const elements = [...mod.elements]
  if (elements.length === 0) throw new TypeError("mod should have elements")
  const first = elements[0]!
  if (typeof(first) === "object" && "key" in first && "value" in first) {
    return { elements:elements.map((x:any) => { return { key:x.key, value:x.value }}) as never}
  }
  if (at < 0) return { elements }
  return { at, elements }
}

function evt<T extends {}>(event?:LEvent<T>):Evt<T>|undefined {
  if (event === undefined) return undefined
  const e:Evt<T> = {  }
  if (event.cleared ?? 0 > 0) e.cleared = event.cleared
  const a = mod(event.added)
  if (a) e.added = a
  const r = mod(event.removed)
  if (r) e.removed = r
  return e
}

export function capture<T extends {}>(stash:Loud<T>):Capture<T> {
  let captured:LEvent<T>|undefined = undefined
  stash.hear(globalThis, event => {
    captured = event
  })
  return {
    get:() => {
      const r = captured;
      captured = undefined;
      return evt(r)
    },
  }
}