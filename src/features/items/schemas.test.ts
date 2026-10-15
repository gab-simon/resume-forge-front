import { describe, expect, it } from "vitest"
import {
  DEFAULT_ITEMS_PAGE_SIZE,
  itemFormSchema,
  itemsSearchSchema,
  resolveItemsSearch,
  toItemPayload,
} from "./schemas"

describe("itemFormSchema", () => {
  it("accepts a name without a description", () => {
    const result = itemFormSchema.safeParse({
      name: "Notebook",
      description: "",
    })
    expect(result.success).toBe(true)
  })

  it("trims the name and rejects a blank one", () => {
    expect(
      itemFormSchema.parse({ name: "  Notebook  ", description: "" }).name,
    ).toBe("Notebook")

    const result = itemFormSchema.safeParse({ name: "   ", description: "" })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe(
      "items.validation.nameRequired",
    )
  })

  it("rejects a name longer than 255 characters", () => {
    const result = itemFormSchema.safeParse({
      name: "a".repeat(256),
      description: "",
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe(
      "items.validation.nameTooLong",
    )
  })
})

describe("toItemPayload", () => {
  it("sends null for an empty description", () => {
    expect(toItemPayload({ name: "Notebook", description: "" })).toEqual({
      name: "Notebook",
      description: null,
    })
  })

  it("keeps a filled description", () => {
    expect(
      toItemPayload({ name: "Notebook", description: "A5, ruled" }),
    ).toEqual({ name: "Notebook", description: "A5, ruled" })
  })
})

describe("items search params", () => {
  it("uses the defaults when the URL has no params", () => {
    expect(resolveItemsSearch(itemsSearchSchema.parse({}))).toEqual({
      page: 1,
      pageSize: DEFAULT_ITEMS_PAGE_SIZE,
    })
  })

  it("keeps valid params", () => {
    expect(
      resolveItemsSearch(itemsSearchSchema.parse({ page: 3, pageSize: 25 })),
    ).toEqual({ page: 3, pageSize: 25 })
  })

  it("drops invalid params instead of throwing", () => {
    expect(
      resolveItemsSearch(itemsSearchSchema.parse({ page: 0, pageSize: "x" })),
    ).toEqual({ page: 1, pageSize: DEFAULT_ITEMS_PAGE_SIZE })
  })
})
