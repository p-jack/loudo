import { Weakness } from "loudo-weakness"

export type Mutable<T extends object> = { -readonly [K in keyof T]: T[K] }

export type Ear<V> = (newValue:V, old:V|undefined)=>void

const heard = Symbol("heard")
export interface Heard {
  readonly [heard]:number
}

export type Exist<T> = T extends {} ? T : never

export type Keys<T> = {
  [K in keyof T]: T[K] extends Loud|undefined ? [K, ...Keys<Exist<T[K]>>] : [K]
}[keyof T];

export type Value<T,K> = K extends []
  ? T
  : K extends [infer Key, ...infer Rest]
    ? Key extends keyof T
      ? Value<T[Key], Rest>
      : Key extends keyof Exist<T> 
        ? Value<Exist<T>[Key],Rest>|undefined
        : undefined
    : never;

export class Loud {
  hearFar<K extends Keys<this>>(_keys:K, _keeper:object, _ear:Ear<Value<this,K>|undefined>):Heard { throw 0 }
  unhear(_heard:Heard):void {}
  hear<K extends keyof this>(_key:K, _keeper:object, _ear:Ear<this[K]>):Heard { throw 0 }
}

class Quiet<T> {
  constructor(readonly value:T) {}
}

export const quiet = <T>(value:T):T => new Quiet(value) as never

const earSymbol = Symbol("ears")

type Ears = Weakness<Ear<any>,string|symbol|number>

export function loudify<T extends object>(object:T):T&Loud {
  const ears:Ears = new Weakness()
  const proxy = new Proxy(object, {
    set:(target:any, p:string|symbol, newValue:any):boolean => {
      if ((typeof (p) !== "symbol") && (typeof (newValue) !== "function")) {
        check(target, p, newValue)
      }
      const oldValue = target[p]
      target[p] = newValue
      if (!compare(oldValue, newValue)) {
        for (const ear of ears.group(p)) ear(newValue, oldValue)
      }
      return true
    },
    get:(target:any, p:string|symbol, receiver:any):any => {
      const value = target[p]
      if (p === "constructor") {
        return target.constructor
      }
      if (value instanceof Function) {
        return function (...args: any) {
          const result = value.apply(receiver, args)
          if (result instanceof Quiet) {
            return result.value
          }
          for (const ear of ears.group(p)) ear(value, undefined)
          return result
        }
      }
      return value
    },
  })
  proxy[earSymbol] = ears
  proxy["hear"] = <K extends keyof T>(key:K, keeper:object, ear:Ear<T[K]>) => {
    const i = ears.add(keeper, ear, key)
    ear(proxy[key], undefined)
    return { [heard]:i }
  }
  proxy["hearFar"] = <K extends Keys<T>>(keys:K, keeper:object, ear:Ear<Value<T,K>|undefined>) => {
    keys = [...keys]
    const refs:(WeakRef<any>|undefined)[] = Array(keys.length).fill(undefined)
    const h:(Heard|undefined)[] = Array(keys.length).fill(undefined)
    const redo = (start:number, first:any) => {
      if (first === undefined) {
        refs[start] = undefined
        ear(undefined, undefined)
      } else refs[start] = new WeakRef(first)
      const values = refs.map(x => x?.deref())
      for (let i = start; i < keys.length; i++) {
        if (h[i] !== undefined) values[i]?.unhear(h[i])
        h[i] = undefined
      }
      for (let i = start + 1; i < keys.length; i++) {
        if (values[i - 1] == undefined) values[i] = undefined
        else values[i] = values[i - 1][keys[i - 1]]
      }
      const last = keys.length - 1
      for (let i = start; i < last; i++) {
        if (values[i] == undefined) break
        const x = values[i][earSymbol].add(keeper, (n:any) => {
          redo(i + 1, n)
        }, keys[i] as never)
        h[i] = { [heard]:x }        
      }
      if (values[last] !== undefined) {
        values[last].hear(keys[last], keeper, ear)
      }
    }
    redo(0, proxy)
    return h[0]
  }
  proxy["unhear"] = (h:Heard) => {
    ears.delete(h[heard])
  }
  extend(proxy, object)
  return proxy as never
}

// interface Batch<T extends object> {
//   target:Loud<T>
//   changes:Partial<T>
// }

// const yell = <T extends object>(source:Loud<T>, key:keyof T) => {
//   const ears:Map<keyof T, Set<(changed:T)=>void>> = (source as any)[earSymbol]
//   const set = ears.get(key);
//   set?.forEach(ear => { ear(source) })
// }

// export class Tx {

//   private readonly batches:Batch<any>[] = []

//   readonly batch = <T extends object>(target:Loud<T>, changes:Partial<T>) => {
//     this.batches.push({target, changes})
//   }

//   readonly commit = () => {
//     const oldGlobalBlock = globalBlock
//     globalBlock = true
//     const batches = this.batches
//     const changed:Set<string>[] = []
//     try {
//       for (const batch of batches) {
//         for (const k in batch.changes) {
//           check(batch.target, k, batch.changes[k])
//         }
//       }
//       for (const batch of batches) {
//         const set = new Set<string>()
//         changed.push(set)
//         for (const k in batch.changes) {
//           if (!compare(batch.target[k], batch.changes[k])) {
//             set.add(k)
//             batch.target[k] = batch.changes[k]
//           }
//         }
//       }
//       for (let i = 0; i < batches.length; i++) {
//         const set = changed[i]!
//         const batch = batches[i]!
//         for (const k of set) {
//           yell(batch.target, k)
//         }
//       }
//     } finally {
//       globalBlock = oldGlobalBlock
//     }  
//   }
// }

// const ksym = Symbol("keep")

// function keep<T extends Function>(parent:{}, child:T):T {
//   let set = (parent as any)[ksym] as Set<Function>
//   if (set === undefined) {
//     set = new Set();
//     (parent as any)[ksym] = set
//   }
//   set.add(child)
//   return child
// }

let extend = <T extends object>(_loud:T&Loud, _observed:T) => {}
export const extendWith = (extender:<T extends object>(loud:T&Loud, observed:T)=>void) => {
  extend = extender
}

let compare = Object.is
export const compareWith = (comparer:(a:any, b:any)=>boolean) => {
  compare = comparer
}

let check = <T extends object>(_obj:T, key:keyof T, _value:T[typeof key]):void => {}
export const checkWith = (checker:<T extends object>(obj:T, key:keyof T, value:T[typeof key])=>void) => {
  check = checker
}
