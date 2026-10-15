import { z } from "zod"

// Every environment variable the app reads is declared and validated here.
// Vite only exposes variables prefixed with VITE_. Add new ones to this schema,
// to src/vite-env.d.ts and to .env.example.
const envSchema = z.object({
  VITE_API_URL: z.url().transform((url) => url.replace(/\/+$/, "")),
})

const parsed = envSchema.safeParse(import.meta.env)

if (!parsed.success) {
  throw new Error(
    `Invalid environment variables. Check your .env file.\n${z.prettifyError(parsed.error)}`,
  )
}

export const env = {
  apiUrl: parsed.data.VITE_API_URL,
} as const
