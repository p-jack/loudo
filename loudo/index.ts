import { Check, CheckError } from "loudo-check"
import { Parsable } from "loudo-ds-core"
import { mixed } from "loudo-mixin"
import { el, El } from "loudo-bind"
import { Loud, Mutable, checkWith, Heard, loudify, Keys, Ear, Value } from "loudify"
import { Ar } from "loudo-ds-array"

const c = Check.conf()
c.augment = loudify
Check.conf(c)

function check<T extends object>(obj:T, key:keyof T, value:T[typeof key]):void {
  if (obj instanceof Check.Base) {
    const fails = Check.runOne(obj.constructor as never, obj, key as never, value as never)
    if (fails.length > 0) {
      throw new CheckError(fails[0]!)
    }
  }
}
checkWith(check)

declare module "loudo-check" {
  export namespace Check {
    export interface Base extends Loud {
      hearFar<K extends Keys<this>>(_keys:K, _keeper:object, _ear:Ear<Value<this,K>|undefined>):Heard
      unhear(_heard:Heard):void
      hear<K extends keyof this>(_key:K, _keeper:object, _ear:Ear<this[K]>):Heard
        }
  }
}

export { Check } from "loudo-check"

export function ar<R extends Check.Base,T extends object>(cls:new(input:T)=>R) {
  return Ar.of(Check.sample(cls))
}

export const oneOff = loudify

Check.addType(Check.collectionType({
  name: "loud data structures",
  make: (sample:Parsable<any>) => { return sample.toEmpty() },
  appliesTo: x => { 
    return typeof(x) === "object" && x !== null && mixed(x, Parsable)
  },
  add: (a:Parsable<any>, v:unknown) => a.add(v),
  sampleElement: (c:Parsable<any>) => c.first,
}))

export type { Loud, El }
export { el }

const ros = { v:"", readonly:true as const }

export class Viewport extends Check.define({
  hash: ros,
  path: ros,

  width: { v:0, min:0, readonly:true },
  height: { v:0, min:0, readonly:true },

  breakpoints: { v:Object.freeze([420]), min:1, readonly:true },
  breakpoint: { v:420, min:0, readonly:true, required:"default" },

  visible: { v:true, readonly:true, required:"default" },
}) {

  constructor(breakpoints = [1024, 720, 420, 360]) {
    super({
      hash: window.location.hash,
      path: window.location.pathname,
      width: window.innerWidth,
      height: window.innerHeight,
      breakpoints: Object.freeze([...breakpoints].sort((a,b) => b - a)),
    })
    const m = this as Mutable<Viewport>
    m.breakpoint = this.breakpointFor(this.width)
    const me = this
    window.addEventListener("popstate", () => {
      m.hash = window.location.hash
      m.path = window.location.pathname
    })
    window.addEventListener("resize", () => {
      m.width = window.innerWidth
      m.height = window.innerHeight
      const old = m.breakpoint
      const breakpoint = me.breakpointFor(window.innerWidth)
      if (breakpoint !== old) {
        m.breakpoint = breakpoint
      }
    })
    /* v8 ignore next 3 */
    document.addEventListener("visibilitychange", () => {
      m.visible = !document.hidden
    })
  }

  goTo(path:string, hash?:string) {
    hash = hash ?? ""
    if (path === this.path && hash === hash) return
    window.history.pushState("{}", "", new URL(path + hash, window.location.href))
    const v = this as Mutable<Viewport>
    v.path = path
    v.hash = hash
  }

  goToHash(hash:string) {
    if (this.hash === hash) return
    console.log(window.location.pathname + hash)
    window.history.pushState("{}", "", new URL(window.location.pathname + hash, window.location.href))
    const v = this as Mutable<Viewport>
    v.hash = hash
  }

  private breakpointFor(width:number) {
    for (const x of this.breakpoints) {
      if (width > x) return x
    }
    return this.breakpoints[this.breakpoints.length - 1]!
  }

}
