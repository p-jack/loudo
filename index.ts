import "loudo-bind"
import { Base, Check, CheckError } from "loudo-check"
import { Loud, loudify, checkWith, Mutable } from "loudify"
import { La } from "loud-array"
import {} from "loudo-bind"
import { el } from "@pjack/el"

Check.augmentWith(loudify)

let check = <T extends object>(obj:T, key:keyof T, value:T[typeof key]):void => {
  if (obj instanceof Base) {
    const fails = Check.runOne(obj.constructor as never, obj, key, value)
    if (fails.length > 0) {
      throw new CheckError(fails[0]!)
    }
  }
}
checkWith(check)

export const define = <S extends Check.Schema>(schema:S):new(fields:Check.In<S>)=>Loud<Check.Out<S>> => {
  return Check.define(schema) as never
}

export const sample = Check.sample

export const parse = Check.parse

export const oneOff = loudify

Check.addType(Check.collectionType({
  name: "loud array",
  make: () => { return new La<unknown>() },
  add: (a:La<unknown>, v:unknown) => a.push(v),
  sampleElement: (c:La<unknown>) => c[0],
}))

export { Base, Check, CheckError, el, La }

export type {
  Loud
}

export class Tab extends define({
  location: { v:window.location, readonly:true },
  width: { v:0, min:0, readonly:true },
  height: { v:0, min:0, readonly:true },
}) {
  get path() { return this.location.pathname }
  goTo(path:string) {
    window.history.pushState(undefined, "", new URL(path, window.location.href))
    mtab.location = window.location
  }
}

export const tab = new Tab({
  location: window.location,
  width: window.innerWidth,
  height: window.innerHeight,
})

const mtab = tab as Mutable<Tab>

window.addEventListener("popstate", () => {
  /* v8 ignore next 2 */
  mtab.location = window.location
})

window.addEventListener("resize", () => {
  mtab.width = window.innerWidth
  mtab.height = window.innerHeight
})
