import { z } from "zod"
import type { ItemCreateResource } from "@/api/generated"
import type { TranslationKey } from "@/lib/i18n"

// A validation message is a key of the locale files, and FormMessage
// translates it. `satisfies` makes a key that does not exist fail the
// typecheck. Add the text to every file in src/locales.
const MESSAGES = {
  nameRequired: "items.validation.nameRequired",
  nameTooLong: "items.validation.nameTooLong",
} as const satisfies Record<string, TranslationKey>

// Form schema. The limits match ItemCreateResource in openapi.json. When the
// back end changes a limit, change it here too. The back end accepts an empty
// name, but the form requires one.
export const itemFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, MESSAGES.nameRequired)
    .max(255, MESSAGES.nameTooLong),
  description: z.string().trim(),
})

export type ItemFormValues = z.infer<typeof itemFormSchema>

/** Converts form values to the request body. An empty description becomes null. */
export function toItemPayload(values: ItemFormValues): ItemCreateResource {
  return {
    name: values.name,
    description: values.description === "" ? null : values.description,
  }
}

export const DEFAULT_ITEMS_PAGE_SIZE = 10
export const ITEMS_PAGE_SIZE_OPTIONS = [5, 10, 25, 50] as const

// Search params of the /items route. An invalid value is dropped instead of
// failing the navigation, so a hand-edited URL still opens the page.
export const itemsSearchSchema = z.object({
  page: z.number().int().min(1).optional().catch(undefined),
  pageSize: z.number().int().min(1).max(100).optional().catch(undefined),
})

export type ItemsSearch = z.infer<typeof itemsSearchSchema>

export interface ItemsPagination {
  /** 1-based page number. */
  page: number
  pageSize: number
}

/** Fills in the defaults for search params that are absent from the URL. */
export function resolveItemsSearch(search: ItemsSearch): ItemsPagination {
  return {
    page: search.page ?? 1,
    pageSize: search.pageSize ?? DEFAULT_ITEMS_PAGE_SIZE,
  }
}
