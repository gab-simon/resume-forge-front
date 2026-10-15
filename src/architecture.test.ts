import { existsSync, readdirSync, readFileSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

// Checks architecture rule 5 from AGENTS.md: code outside a feature imports it
// only through `features/<name>` (data API) or `features/<name>/components`
// (public components). biome.json enforces the same rule for "@/features/..."
// specifiers. This test also covers relative imports.

const SRC = path.resolve(import.meta.dirname)
const FEATURES = path.join(SRC, "features")
const IMPORT_PATTERN = /(?:from\s+|import\s*\(\s*|import\s+)["']([^"']+)["']/g

function sourceFiles(): string[] {
  return readdirSync(SRC, { recursive: true, encoding: "utf8" })
    .filter((file) => /\.tsx?$/.test(file))
    .filter((file) => !file.startsWith(path.join("api", "generated")))
    .map((file) => path.join(SRC, file))
}

function featureOf(file: string): string | undefined {
  const relative = path.relative(FEATURES, file)
  if (relative.startsWith("..")) {
    return undefined
  }
  return relative.split(path.sep)[0]
}

function resolveImport(
  fromFile: string,
  specifier: string,
): string | undefined {
  if (specifier.startsWith("@/")) {
    return path.join(SRC, specifier.slice(2))
  }
  if (specifier.startsWith(".")) {
    return path.resolve(path.dirname(fromFile), specifier)
  }
  return undefined
}

describe("architecture", () => {
  it("imports features only through their public entry points", () => {
    const violations: string[] = []

    for (const file of sourceFiles()) {
      const source = readFileSync(file, "utf8")
      for (const match of source.matchAll(IMPORT_PATTERN)) {
        const specifier = match[1]
        const target = specifier && resolveImport(file, specifier)
        const targetFeature = target && featureOf(target)
        if (!target || !targetFeature || targetFeature === featureOf(file)) {
          continue
        }
        const inside = path
          .relative(path.join(FEATURES, targetFeature), target)
          .replace(/(^|[\\/])index(\.ts)?$/, "")
        if (inside !== "" && inside !== "components") {
          violations.push(`${path.relative(SRC, file)} imports "${specifier}"`)
        }
      }
    }

    expect(violations).toEqual([])
  })

  it("gives every feature an index.ts", () => {
    const missing = readdirSync(FEATURES, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .filter(
        (entry) => !existsSync(path.join(FEATURES, entry.name, "index.ts")),
      )
      .map((entry) => entry.name)

    expect(missing).toEqual([])
  })
})
