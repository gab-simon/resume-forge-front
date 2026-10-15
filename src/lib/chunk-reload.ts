export const CHUNK_RELOAD_KEY = "chunk-reload-at"

// A second failure inside this window means the reload did not fix the
// problem, for example because the network is down. The handler then lets the
// error reach the router error screen instead of reloading in a loop.
export const CHUNK_RELOAD_COOLDOWN_MS = 10_000

interface ChunkReloadOptions {
  target: EventTarget
  storage: Pick<Storage, "getItem" | "setItem">
  reload: () => void
  now?: () => number
}

/**
 * Reloads the page when a lazy chunk fails to load.
 *
 * Every deploy renames the files in /assets. A tab opened before the deploy
 * still points to the old names, so its next navigation requests a file that
 * no longer exists. Vite reports that with the `vite:preloadError` event, and
 * a reload fetches the new index.html with the new names.
 */
export function installChunkReloadHandler({
  target,
  storage,
  reload,
  now = Date.now,
}: ChunkReloadOptions): void {
  target.addEventListener("vite:preloadError", () => {
    const current = now()
    if (current - readLastReload(storage) < CHUNK_RELOAD_COOLDOWN_MS) {
      return
    }
    try {
      storage.setItem(CHUNK_RELOAD_KEY, String(current))
    } catch {
      // Without storage the handler cannot detect a loop, so it does not
      // reload at all.
      return
    }
    reload()
  })
}

function readLastReload(storage: Pick<Storage, "getItem">): number {
  try {
    const value = Number(storage.getItem(CHUNK_RELOAD_KEY))
    return Number.isFinite(value) ? value : 0
  } catch {
    return 0
  }
}
