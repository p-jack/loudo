import { test, expect } from "vitest"
import { MapsortBase } from "./index"
import { Loud, Sized, Stash } from "loudo-ds-core"
import { MapBase } from "loudo-ds-map-interfaces"
import { mixin, mixed } from "loudo-mixin"

class X {}
interface X extends MapsortBase<number,string> {}
mixin(X, [MapsortBase])

test("mapsorts", () => {
  const m = new X()
  expect(mixed(m, MapsortBase)).not.toBeUndefined()
  expect(mixed(m, MapBase)).not.toBeUndefined()
  expect(mixed(m, Loud)).not.toBeUndefined()
  expect(mixed(m, Sized)).not.toBeUndefined()
  expect(mixed(m, Stash)).not.toBeUndefined()
})
