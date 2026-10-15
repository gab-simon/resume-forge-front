// Public data API of the account feature: hooks, query options and schemas.
// Nothing here renders UI, so route loaders can import this file without
// pulling the feature's components into the main bundle.
//
// Public components are exported from ./components/index.ts.
export { useUpdateMe } from "./api/mutations"
export { meOptions, templatesOptions, useMe, useTemplates } from "./api/queries"
export {
  type SettingsFormValues,
  settingsFormSchema,
  toSettingsFormValues,
  toSettingsPayload,
} from "./schemas"
