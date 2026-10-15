// Public data API of the items feature: hooks, query options, schemas and
// types. Nothing here renders UI, so route loaders can import this file
// without pulling the feature's components into the main bundle.
//
// Public components are exported from ./components/index.ts.
export { useCreateItem, useDeleteItem, useUpdateItem } from "./api/mutations"
export { itemsListOptions, useItemsList } from "./api/queries"
export {
  type ItemsPagination,
  type ItemsSearch,
  itemsSearchSchema,
  resolveItemsSearch,
} from "./schemas"
