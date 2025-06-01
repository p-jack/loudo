import { Weakness} from "./index"
import { expect, test } from "vitest"

interface O {
  x: number
}

const G1 = "g1"
const G2 = "g2"

async function gc() {
  await new Promise<void>(resolve => {
    setTimeout(() => {
      global.gc()
      resolve()
    })
  })
}

function gcWeakness(k:object) {
  const w = new Weakness<O,string>()
  const o = {x:1}
  w.add(k, o as O, G1)
  return w
}

test("keeper garbage collected", async () => {
  let k:object|undefined = {}
  const w = gcWeakness(k)
  k = undefined
  await gc()
  expect([...w]).toStrictEqual([])
  expect([...w.group(G1)]).toStrictEqual([])
  expect([...w.group(G2)]).toStrictEqual([])
})

test("keeper NOT garbage collected", async () => {
  const k = {}
  const w = gcWeakness(k)
  await gc()
  expect([...w]).toStrictEqual([{x:1}])
  expect([...w.group(G1)]).toStrictEqual([{x:1}])
  expect([...w.group(G2)]).toStrictEqual([])
})

test("add/delete", () => {
  const w = new Weakness<O,string>()
  const k = {}
  const o = {x:1}
  const handle = w.add(k, o, G1)
  expect(handle).toBe(1)
  expect([...w]).toStrictEqual([o])
  expect([...w.group(G1)]).toStrictEqual([o])
  expect([...w.group(G2)]).toStrictEqual([])
  w.delete(-5)
  expect([...w]).toStrictEqual([o])
  expect([...w.group(G1)]).toStrictEqual([o])
  expect([...w.group(G2)]).toStrictEqual([])
  w.delete(handle)
  expect([...w]).toStrictEqual([])
  expect([...w.group(G1)]).toStrictEqual([])
  expect([...w.group(G2)]).toStrictEqual([])
})

test("add identical element", () => {
  const w = new Weakness<O,string>()
  const k = {}
  const o = {x:1}
  const handle1 = w.add(k, o, G1)
  expect(handle1).toBe(1)
  expect([...w]).toStrictEqual([o])
  expect([...w.group(G1)]).toStrictEqual([o])
  expect([...w.group(G2)]).toStrictEqual([])
  const handle2 = w.add(k, o, G1)
  expect(handle2).toBe(2)
  expect([...w]).toStrictEqual([o, o])
  expect([...w.group(G1)]).toStrictEqual([o, o])
  expect([...w.group(G2)]).toStrictEqual([])
  w.delete(handle1)
  expect([...w]).toStrictEqual([o])
  expect([...w.group(G1)]).toStrictEqual([o])
  expect([...w.group(G2)]).toStrictEqual([])
  w.delete(handle2)
  expect([...w]).toStrictEqual([])
  expect([...w.group(G1)]).toStrictEqual([])
  expect([...w.group(G2)]).toStrictEqual([])
})
