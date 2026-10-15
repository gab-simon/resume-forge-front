import { describe, expect, it } from "vitest"
import {
  createJsonStorage,
  getOrCreateId,
  type KeyValueStorage,
} from "./browser-storage"

function memoryStorage(): KeyValueStorage & { data: Map<string, string> } {
  const data = new Map<string, string>()
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value)
    },
    removeItem: (key) => {
      data.delete(key)
    },
  }
}

const blockedStorage: KeyValueStorage = {
  getItem: () => {
    throw new Error("SecurityError")
  },
  setItem: () => {
    throw new Error("SecurityError")
  },
  removeItem: () => {
    throw new Error("SecurityError")
  },
}

function isPoint(value: unknown): value is { x: number } {
  return (
    typeof value === "object" &&
    value !== null &&
    "x" in value &&
    typeof value.x === "number"
  )
}

describe("createJsonStorage", () => {
  it("stores, reads and clears a value", () => {
    const storage = memoryStorage()
    const point = createJsonStorage(storage, "point", isPoint)

    point.set({ x: 1 })
    expect(storage.data.get("point")).toBe('{"x":1}')
    expect(point.get()).toEqual({ x: 1 })

    point.clear()
    expect(point.get()).toBeNull()
  })

  it.each(["not json", '{"y":1}'])("reads %j as null", (raw) => {
    const storage = memoryStorage()
    storage.setItem("point", raw)

    expect(createJsonStorage(storage, "point", isPoint).get()).toBeNull()
  })

  it("keeps the value in memory when the browser blocks storage", () => {
    const point = createJsonStorage(blockedStorage, "point", isPoint)

    point.set({ x: 2 })
    expect(point.get()).toEqual({ x: 2 })

    point.clear()
    expect(point.get()).toBeNull()
  })
})

describe("getOrCreateId", () => {
  it("creates the identifier once and then reuses it", () => {
    const storage = memoryStorage()
    let next = 0
    const create = () => `id-${next++}`

    expect(getOrCreateId(storage, "device", create)).toBe("id-0")
    expect(getOrCreateId(storage, "device", create)).toBe("id-0")
  })

  it("returns a new identifier when the browser blocks storage", () => {
    expect(getOrCreateId(blockedStorage, "device", () => "fresh")).toBe("fresh")
  })
})
