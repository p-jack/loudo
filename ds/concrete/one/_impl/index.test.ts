import { test, expect } from "vitest"
import { One } from "./index"

test("One", () => {
  const one = One.of("111")
  expect(one.size).toBe(1)
  expect(one.empty).toBe(false)
  expect(one.has("111")).toBe(true)
  expect(one.has("222")).toBe(false)
  expect(one.first).toBe("111")
  expect(one.last).toBe("111")
  expect(one.only).toBe("111")
  expect([...one]).toStrictEqual(["111"])
  expect([...one]).toStrictEqual(["111"])
})
