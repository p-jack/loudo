interface ByN<V extends object,G extends {}> {
  g:G
  v:WeakRef<V>
  k:WeakRef<object>
}

type IMap<T extends object,G extends {}> = Map<number,ByN<T,G>>
type GMap<T extends object,G extends {}> = Map<G,Map<number,WeakRef<T>>>

interface Held {
  i:WeakRef<IMap<any,any>>
  g:WeakRef<GMap<any,any>>
  n:number
}

const reg = new FinalizationRegistry((held:Held) => {
  const i = held.i.deref()
  i?.delete(held.n)
  const g = held.g.deref()
  g?.delete(held.n)
})

export class Weakness<T extends object,G extends {}> {

  private wi:WeakRef<IMap<T,G>>
  private wg:WeakRef<GMap<T,G>>

  constructor(
    private n = 0,
    private i:IMap<T,G> = new Map(),
    private g:GMap<T,G> = new Map(),
  ) {
    this.wi = new WeakRef(this.i)
    this.wg = new WeakRef(this.g)
  }

  group(g:G):Iterable<T> {
    const r = this.g.get(g)
    if (r === undefined) return []
    return {
      *[Symbol.iterator]() {
        for (const w of r.values()) {
          const x = w.deref()
          if (x) yield x
        }
      }
    }
  }

  add(keeper:object, v:T, g:G) {
    this.n++
    const weakV = new WeakRef(v)
    this.i.set(this.n, { g, v:weakV, k:new WeakRef(keeper) })
    retain(keeper, v)
    let group = this.g.get(g)
    if (group === undefined) {
      group = new Map()
      this.g.set(g, group)
    }
    group.set(this.n, weakV)
    reg.register(v, { n:this.n, g:this.wg, i:this.wi }, v)
    return this.n
  }

  delete(n:number):void {
    const byN = this.i.get(n)
    if (byN === undefined) return
    const v = byN.v.deref()
    /* v8 ignore next */
    if (v === undefined) return
    const k = byN.k.deref()
    if (k) release(k, v)
    this.i.delete(n)
    const group = this.g.get(byN.g)
    if (group !== undefined) {
      group.delete(n)
      if (group.size === 0) {
        this.g.delete(byN.g)
      }
    }
    reg.unregister(v)
    return
  }

  *[Symbol.iterator]() {
    for (const x of this.i.values()) {
      const v = x.v.deref()
      if (v) yield v
    }
  }
}

const sym = Symbol("refs")

function keepFor(o:any) {
  let m = o[sym] as Map<object,number>
  if (m === undefined) {
    m = new Map()
    o[sym] = m
  }
  return m
}

function retain(keeper:object, child:object) {
  const m = keepFor(keeper)
  m.set(child, (m.get(child) ?? 0) + 1)
}

function release(keeper:object, child:object) {
  const m = keepFor(keeper)
  /* v8 ignore next */
  const n = (m.get(child) ?? 0) - 1
  if (n <= 0) m.delete(child)
  else m.set(child, n)
}