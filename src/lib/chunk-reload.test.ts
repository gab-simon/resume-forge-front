import { describe, expect, it, vi } from "vitest"
import {
  CHUNK_RELOAD_COOLDOWN_MS,
  CHUNK_RELOAD_KEY,
  installChunkReloadHandler,
} from "./chunk-reload"

function createStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial))
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value)
    },
  }
}

function setup(storage = createStorage(), startAt = 1_000_000) {
  const target = new EventTarget()
  const reload = vi.fn()
  const clock = { now: startAt }
  installChunkReloadHandler({
    target,
    storage,
    reload,
    now: () => clock.now,
  })
  const fail = () => target.dispatchEvent(new Event("vite:preloadError"))
  return { clock, fail, reload, storage }
}

describe("installChunkReloadHandler", () => {
  it("reloads the page when a chunk fails to load", () => {
    const { fail, reload, storage } = setup()

    fail()

    expect(reload).toHaveBeenCalledTimes(1)
    expect(storage.getItem(CHUNK_RELOAD_KEY)).toBe("1000000")
  })

  it("does not reload again when the failure repeats right after a reload", () => {
    const storage = createStorage({ [CHUNK_RELOAD_KEY]: "999000" })
    const { fail, reload } = setup(storage)

    fail()

    expect(reload).not.toHaveBeenCalled()
  })

  it("reloads again after the cooldown has passed", () => {
    const { clock, fail, reload } = setup()

    fail()
    clock.now += CHUNK_RELOAD_COOLDOWN_MS
    fail()

    expect(reload).toHaveBeenCalledTimes(2)
  })

  it("ignores a stored value that is not a number", () => {
    const storage = createStorage({ [CHUNK_RELOAD_KEY]: "not-a-number" })
    const { fail, reload } = setup(storage)

    fail()

    expect(reload).toHaveBeenCalledTimes(1)
  })

  it("does not reload when the storage cannot be written", () => {
    const storage = {
      getItem: () => null,
      setItem: () => {
        throw new Error("storage is blocked")
      },
    }
    const { fail, reload } = setup(storage)

    fail()

    expect(reload).not.toHaveBeenCalled()
  })

  it("does not reload when the storage cannot be read or written", () => {
    const storage = {
      getItem: (): string | null => {
        throw new Error("storage is blocked")
      },
      setItem: () => {
        throw new Error("storage is blocked")
      },
    }
    const { fail, reload } = setup(storage)

    fail()

    expect(reload).not.toHaveBeenCalled()
  })
})
