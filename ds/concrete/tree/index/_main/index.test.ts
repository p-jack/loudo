import { test, expect, describe, beforeEach } from "vitest"
import { TreeIndex, Conf } from "./index"
import { mixin, mixed } from "loudo-mixin"
import { IN_EX, Loud, Sized, Stash } from "loudo-ds-core"
import { SetAdd, SetBase, SetChange, SetRemove } from "loudo-ds-set-interfaces"
import { IndexBase, IndexRemove } from "loudo-ds-index-interfaces"
import { SetsortBase, SetsortChange } from "loudo-ds-setsort-interfaces"
import { capture } from "loudo-ds-tools-capture"

interface User {
  id:string
  email:string
}

const conf:Conf<string,User> = {
  index: x => x.id,
  compareKey: (k1,k2) => k1.localeCompare(k2)
}

let tree = new TreeIndex([], conf)
let c = capture(tree)

const user1 = {id:"1", email:"a@z.z"}
const user2 = {id:"2", email:"b@z.z"}
const user3 = {id:"3", email:"c@z.z"}
const userX = {id:"X", email:"x@z.z"}
const blank = {id:"", email:""}

beforeEach(() => {
  tree = new TreeIndex([user2, user3, user1], conf)
  c = capture(tree)
  expect(c.get()).toStrictEqual({
    added:{elements:[user1, user2, user3], at:0}
  })
})

describe("add", () => {
  test("existing element", () => {
    expect(tree.add(user1)).toBe(false)
    expect([...tree]).toStrictEqual([user1, user2, user3])
    expect(tree.size).toBe(3)
    expect(c.get()).toBeUndefined()
  })
  test("changing existing element", () => {
    expect(tree.add(user1)).toBe(false)
    const u = {id:"1", email:"11@z.z"}
    expect(tree.add(u)).toBe(true)
    expect([...tree]).toStrictEqual([u, user2, user3])
    expect(tree.size).toBe(3)
    expect(c.get()).toStrictEqual({
      removed:{elements:[user1], at:0},
      added:{elements:[u], at:0},
    })
  })
  test("adding new element", () => {
    expect(tree.add(userX)).toBe(true)
    expect([...tree]).toStrictEqual([user1, user2, user3, userX])
    expect(tree.size).toBe(4)
    expect(c.get()).toStrictEqual({
      added:{elements:[userX], at:3}
    })
  })
})

test("addAll", () => {
  expect(tree.addAll([user1, blank, userX])).toBe(2)
  expect(tree.size).toBe(5)
  expect([...tree]).toStrictEqual([blank, user1, user2, user3, userX])
  expect(c.get()).toStrictEqual({
    added:{elements:[userX], at:4}
  })
})

test("after", () => {
  expect(tree.after(user1)).toStrictEqual(user2)
  expect(tree.after(user3)).toBeUndefined()
})

test("before", () => {
  expect(tree.before(user3)).toStrictEqual(user2)
  expect(tree.before(blank)).toBeUndefined()
})

test("clear", () => {
  tree.clear()
  expect(tree.size).toBe(0)
  expect([...tree]).toStrictEqual([])
  expect(c.get()).toStrictEqual({cleared:3})
})

test("compare", () => {
  expect(tree.compare(user1, user1)).toBe(0)
  expect(tree.compare(user1, user2)).toBeLessThan(0)
  expect(tree.compare(user3, user1)).toBeGreaterThan(0)
})

test("drop", () => {
  tree.drop(u => u.id === "X")
  expect(c.get()).toBeUndefined()
  tree.drop(u => u.id === "2")
  expect(c.get()).toStrictEqual({
    removed:{elements:[user2], at:1}
  })
})

test("first", () => {
  expect(tree.first).toStrictEqual(user1)
})

test("from", () => {
  expect(tree.from(user1)).toStrictEqual(user1)
  expect(tree.from(userX)).toBeUndefined()
})

test("get", () => {
  expect(tree.get("1")).toStrictEqual(user1)
  expect(tree.get("2")).toStrictEqual(user2)
  expect(tree.get("3")).toStrictEqual(user3)
  expect(tree.get("4")).toBeUndefined()
})

test("index", () => {
  expect(tree.index({id:"123", email:"x@z.z"})).toBe("123")
})

test("iterator", () => {
  expect([...tree]).toStrictEqual([user1, user2, user3])
  expect([...tree]).toStrictEqual([user1, user2, user3])
})

test("last", () => {
  expect(tree.last).toStrictEqual(user3)
})

test("mixins", () => {
  const i = new TreeIndex<string,User>([], conf)
  expect(mixed(i, SetsortChange)).toBe(true)
  expect(mixed(i, SetsortBase)).toBe(true)
  expect(mixed(i, IndexRemove)).toBe(true)
  expect(mixed(i, IndexBase)).toBe(true)
  expect(mixed(i, SetAdd)).toBe(true)
  expect(mixed(i, SetRemove)).toBe(true)
  expect(mixed(i, SetBase)).toBe(true)
  expect(mixed(i, Loud)).toBe(true)
  expect(mixed(i, Sized)).toBe(true)
  expect(mixed(i, Stash)).toBe(true)
})

test("only", () => {
  expect(() => tree.only).toThrowError()
  tree = new TreeIndex([user1], conf)
  expect(tree.only).toStrictEqual(user1)
})

test("range", () => {
  const r = tree.range(user1, user3, IN_EX)
  expect([...r]).toStrictEqual([user1, user2])
  expect([...r]).toStrictEqual([user1, user2])
})

test("removeKey", () => {
  expect(tree.removeKey("X")).toBeUndefined()
  expect(tree.removeKey("2")).toStrictEqual(user2)
  expect([...tree]).toStrictEqual([user1, user3])
  expect(c.get()).toStrictEqual({
    removed:{elements:[user2], at:1}
  })
})

test("replace", () => {
  tree.replace([blank, userX])
  expect(tree.size).toBe(2)
  expect([...tree]).toStrictEqual([blank, userX])
  expect(c.get()).toStrictEqual({
    cleared:3,
    added:{elements:[blank, userX], at:0}
  })
})

test("reversed", () => {
  const r = tree.reversed()
  expect([...r]).toStrictEqual([user3, user2, user1])
  expect([...r]).toStrictEqual([user3, user2, user1])
})

test("size", () => {
  expect(tree.size).toBe(3)
})

test("to", () => {
  expect(tree.to(user3)).toStrictEqual(user3)
  expect(tree.to(blank)).toBeUndefined()
})
