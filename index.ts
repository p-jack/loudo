import "loudo-bind"
import { Check } from "loudo-check"
import {
  Loud,
  loudify,
  extendWith as loudExtendWith,
  checkWith as loudCheckWith
} from "loudify"
import { TJSON } from "@pjack/tjson"
import { La } from "loud-array"

loudExtendWith(<T extends object>(loud:Loud<T>, observed:T) => {
  const a = observed as any
  a[TJSON.beforeParse] = ():object => observed
  a[TJSON.afterParse] = (o:object) => loudify(o)
})
loudCheckWith(<T extends object,K extends keyof T>(obj:T, key:K, value:T[K]) => {
  const fails = Check.runOne(obj, key, value)
  if (fails.length > 0) {
    throw new TypeError(fails.map(x => x.message).join("; "))
  }
})

TJSON.checkWith(Check.run)

const laType:TJSON.Type = {
  priority: 15_000_000,
  isValid: <T>(sample:T):boolean => {
    return sample instanceof La
  },
  parse: async (lex:TJSON.Lex, sample:any) => {
    const array = (sample as La<any>[])
    if (array.length === 0) {
      throw lex.error("No sample element in sample loud array.")
    }
    const sampleElement = (sample as any[])[0]
    const result:La<any>[] = new La()
    for await (const x of lex.elements(sampleElement)) {
      result.push(x)
    }
    return result
  }
}
TJSON.addType(laType)

const loudCopy = <T extends object>(sample:Loud<T>, value:T) => {
  const result = loudify(value)
  Check.copy(sample, result)
  return result
}

const modelify = <T extends Record<string,Check.Property<any>>>(schema:T) => {
  return loudify(Check.define(schema))
}

export {
  Check,
  loudify,
  modelify,
  loudCopy,
  TJSON,
}

export type {
  Loud
}
