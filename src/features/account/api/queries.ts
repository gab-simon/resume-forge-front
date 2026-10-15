import { useQuery } from "@tanstack/react-query"
import {
  meReadMeOptions,
  resumeReadTemplatesOptions,
} from "@/api/generated/@tanstack/react-query.gen"

/** The signed-in user. Route loaders and components share this key. */
export function meOptions() {
  return meReadMeOptions()
}

export function useMe() {
  return useQuery(meOptions())
}

/** Resume templates a user can pick as the default. */
export function templatesOptions() {
  return resumeReadTemplatesOptions()
}

export function useTemplates() {
  return useQuery(templatesOptions())
}
