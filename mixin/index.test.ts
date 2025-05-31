import { test, expect, describe } from "vitest"
import { mixed, mixin, augment } from "./index"

describe("mixin", () => {
  const keepGetter = Symbol("keepGetter")
  const keepMethod = Symbol("keepMethod")
  const newGetter = Symbol("newGetter")
  const newMethod = Symbol("newMethod")
  abstract class StateOnDemand {
    private mixinField_?:number
    protected abstract get field():number
    get mixinField() {
      return this.mixinField_ ?? 1000
    }
    set mixinField(n:number) {
      this.mixinField_ = n
    }
  }
  class NoReplace {
    get keepGetter():string { throw new Error() }
    get [keepGetter]():string { throw new Error() }
    keepMethod(_:number):string { throw new Error() }
    [keepMethod](_:number):string { throw new Error() }
  }
  abstract class NewStuff {
    get newGetter() { return "newGetter-" + (this.mixinField + this.field) }
    get [newGetter]() { return "[newGetter]-" + (this.mixinField + this.field) }
    newMethod(n:number) { return "newMethod-" + (this.mixinField + this.field + n) }
    [newMethod](n:number) { return "[newMethod]-" + (this.mixinField + this.field + n) }
  }
  interface NewStuff extends StateOnDemand {}
  mixin(NewStuff, [StateOnDemand]) // note both are abstract
  abstract class Override {
    keepMethod(n:number) { return "override-" + (this.mixinField + this.field + n) }
  }
  interface Override extends StateOnDemand {}
  mixin(Override, [StateOnDemand])
  abstract class Recurse {
    get recurse() { return "recurse" }
  }
  interface NewStuff extends Recurse {}
  mixin(NewStuff, [Recurse])
  abstract class NotMixedParent {}
  abstract class NotMixedChild {}
  mixin(NotMixedChild, [NotMixedParent])
  expect(() => { mixin(() => {}, [NewStuff])}).toThrowError()
  expect(() => { mixin(NewStuff, [() => {}]) }).toThrowError()
  expect(() => { mixin(StateOnDemand, [NewStuff])}).toThrowError()
  test("private constructor", () => {
    class Private {
      private constructor() {}
      field = 100
      get keepGetter() { return "keepGetter-" + (this.field + this.mixinField) }
      get [keepGetter]() { return "[keepGetter]-" + (this.field + this.mixinField) }
      keepMethod(n:number) { return "keepMethod-" + (this.field + n + this.mixinField) }
      [keepMethod](n:number) { return "[keepMethod]-" + (this.field + n + this.mixinField) }
      static make():Private { return new Private() }
    }
    interface Private extends NoReplace, NewStuff {}
    mixin(Private, [NoReplace, NewStuff])
    const instance = Private.make()
    instance.mixinField = 2000
    const o:object = instance
    if (mixed(o, NoReplace)) expect(o.keepGetter).toBe("keepGetter-2100")
    else expect(false).toBe(true)
    if (mixed(o, StateOnDemand)) expect(o.mixinField).toBe(2000)
    else expect(false).toBe(true)
    if (mixed(o, Recurse)) expect(o.recurse).toBe("recurse")
    else expect(false).toBe(true)
    if (mixed(o, NewStuff)) expect(o.newGetter).toBe("newGetter-2100")
    expect(mixed(o, NotMixedParent)).toBe(false)
    expect(mixed(o, NotMixedChild)).toBe(false)    
    expect(instance.keepGetter).toBe("keepGetter-2100")
    expect(instance[keepGetter]).toBe("[keepGetter]-2100")
    expect(instance.keepMethod(30)).toBe("keepMethod-2130")
    expect(instance[keepMethod](30)).toBe("[keepMethod]-2130")
    expect(instance.newGetter).toBe("newGetter-2100")
    expect(instance[newGetter]).toBe("[newGetter]-2100")
    expect(instance.newMethod(30)).toBe("newMethod-2130")
    expect(instance[newMethod](30)).toBe("[newMethod]-2130")
    expect(instance.recurse).toBe("recurse")
    mixin(Private, Override, { overrides:["keepMethod"] })
    expect(instance.keepMethod(30)).toBe("override-2130")
  })
  test("protected constructor", () => {
    class Protected {
      protected constructor() {}
      field = 100
      get keepGetter() { return "keepGetter-" + (this.field + this.mixinField) }
      get [keepGetter]() { return "[keepGetter]-" + (this.field + this.mixinField) }
      keepMethod(n:number) { return "keepMethod-" + (this.field + n + this.mixinField) }
      [keepMethod](n:number) { return "[keepMethod]-" + (this.field + n + this.mixinField) }
      static make():Protected { return new Protected() }
    }
    interface Protected extends NoReplace, NewStuff {}
    mixin(Protected, [NoReplace, NewStuff])
    const instance = Protected.make()
    instance.mixinField = 2000
    const o:object = instance
    if (mixed(o, NoReplace)) expect(o.keepGetter).toBe("keepGetter-2100")
    else expect(false).toBe(true)
    if (mixed(o, StateOnDemand)) expect(o.mixinField).toBe(2000)
    else expect(false).toBe(true)
    if (mixed(o, Recurse)) expect(o.recurse).toBe("recurse")
    else expect(false).toBe(true)
    if (mixed(o, NewStuff)) expect(o.newGetter).toBe("newGetter-2100")
    expect(mixed(o, NotMixedParent)).toBe(false)
    expect(mixed(o, NotMixedChild)).toBe(false)    
    expect(instance.keepGetter).toBe("keepGetter-2100")
    expect(instance[keepGetter]).toBe("[keepGetter]-2100")
    expect(instance.keepMethod(30)).toBe("keepMethod-2130")
    expect(instance[keepMethod](30)).toBe("[keepMethod]-2130")
    expect(instance.newGetter).toBe("newGetter-2100")
    expect(instance[newGetter]).toBe("[newGetter]-2100")
    expect(instance.newMethod(30)).toBe("newMethod-2130")
    expect(instance[newMethod](30)).toBe("[newMethod]-2130")
    expect(instance.recurse).toBe("recurse")
    mixin(Protected, Override, { overrides:["keepMethod"] })
    expect(instance.keepMethod(30)).toBe("override-2130")
  })
  test("public constructor", () => {
    class Public {
      constructor() {}
      field = 100
      get keepGetter() { return "keepGetter-" + (this.field + this.mixinField) }
      get [keepGetter]() { return "[keepGetter]-" + (this.field + this.mixinField) }
      keepMethod(n:number) { return "keepMethod-" + (this.field + n + this.mixinField) }
      [keepMethod](n:number) { return "[keepMethod]-" + (this.field + n + this.mixinField) }
    }
    interface Public extends NoReplace, NewStuff {}
    mixin(Public, [NoReplace, NewStuff])
    const instance = new Public()
    instance.mixinField = 2000
    const o:object = instance
    if (mixed(o, NoReplace)) expect(o.keepGetter).toBe("keepGetter-2100")
    else expect(false).toBe(true)
    if (mixed(o, StateOnDemand)) expect(o.mixinField).toBe(2000)
    else expect(false).toBe(true)
    if (mixed(o, Recurse)) expect(o.recurse).toBe("recurse")
    else expect(false).toBe(true)
    if (mixed(o, NewStuff)) expect(o.newGetter).toBe("newGetter-2100")
    expect(mixed(o, NotMixedParent)).toBe(false)
    expect(mixed(o, NotMixedChild)).toBe(false)    
    expect(instance.keepGetter).toBe("keepGetter-2100")
    expect(instance[keepGetter]).toBe("[keepGetter]-2100")
    expect(instance.keepMethod(30)).toBe("keepMethod-2130")
    expect(instance[keepMethod](30)).toBe("[keepMethod]-2130")
    expect(instance.newGetter).toBe("newGetter-2100")
    expect(instance[newGetter]).toBe("[newGetter]-2100")
    expect(instance.newMethod(30)).toBe("newMethod-2130")
    expect(instance[newMethod](30)).toBe("[newMethod]-2130")
    expect(instance.recurse).toBe("recurse")
    mixin(Public, Override, { overrides:["keepMethod"] })
    expect(instance.keepMethod(30)).toBe("override-2130")
  })
  test("kids", () => {
    abstract class Mixin1<T extends {}> {
      abstract get mixin1():T
      toString() { return this.mixin1.toString() }
    }
    class Target<T extends {}> {
      constructor(readonly value:T) {}
      get mixin1() { return this.value }
    }
    interface Target<T extends {}> extends Mixin1<T> {}
    mixin(Target, [Mixin1])
    const instance = new Target(111)
    expect(instance.toString()).toBe("111")
    class Mixin2<T extends {}> {
      convert(x:T) { return x.toString() }
    }
    interface Mixin1<T extends {}> extends Mixin2<number>{}
    mixin(Mixin1, [Mixin2])
    expect(instance.convert(222)).toBe("222")
  })

})

test("mixed", () => {
  class Stash {}
  class Sized {}
  mixin(Sized, [Stash])
  class BaseA {}
  mixin(BaseA, [Sized])
  class AChange {}
  mixin(AChange, [BaseA])
  class ARemove {}
  mixin(ARemove, [BaseA])
  class AAdd {}
  mixin(AAdd, [BaseA])  
  class R {}
  mixin(R, [BaseA])
  class M {}
  mixin(M, [AChange, ARemove, AAdd])
  class No {}
  const r = new R()
  expect(mixed(r, BaseA)).toBe(true)
  expect(mixed(r, Sized)).toBe(true)
  expect(mixed(r, Stash)).toBe(true)
  expect(mixed(r, No)).toBe(false)
})

test("augment", () => {
  const f = Symbol("f")
  class A {
    count = 0
    f(n:number, b:string):string {
      return b + ":" + (n + this.count)
    }
    [f](n:number) { return n + this.count }
    get g() { return 5 }
  }
  const a = new A()
  a.count = 5
  expect(a.f(1, "A")).toBe("A:6")
  augment(A, "f", (original, ths, n, b) => {
    return original.call(ths, n + 1, b)
  })
  expect(a.f(1, "A")).toBe("A:7")
  expect(a[f](1)).toBe(6)
  augment(A, f, (original, ths, n) => {
    return original.call(ths, n + 1)
  })
  expect(a[f](1)).toBe(7)
})
