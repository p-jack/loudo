import { loudCopy, modelify } from "./index"
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  test,
} from 'vitest'

test("modelify", ()=> {
  const sample = modelify({
    count:{ v:0, min:0 },
    other:{ v:"a", min:1 }
  })
  const model = loudCopy(sample, {
    count: 0,
    other: "b" 
  })
  expect(() => { model.count = -1 }).toThrow("count: value of -1 < minimum value of 0")
})
