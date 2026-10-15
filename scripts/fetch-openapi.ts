// Downloads the OpenAPI schema from the back end into ./openapi.json.
// Run with `bun run fetch-openapi`. Bun loads VITE_API_URL from .env.
import { writeFile } from "node:fs/promises"

const apiUrl = process.env.VITE_API_URL
if (!apiUrl) {
  console.error("VITE_API_URL is not set. Copy .env.example to .env first.")
  process.exit(1)
}

const url = `${apiUrl.replace(/\/+$/, "")}/openapi.json`
const response = await fetch(url)
if (!response.ok) {
  console.error(`GET ${url} returned ${response.status}`)
  process.exit(1)
}

const schema: unknown = await response.json()
await writeFile("openapi.json", `${JSON.stringify(schema, null, 2)}\n`)
console.log(`Wrote openapi.json from ${url}`)
