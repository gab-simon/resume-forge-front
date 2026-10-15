import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { getErrorMessage } from "@/api/errors"
import type { UserResource } from "@/api/generated"
import { ErrorState } from "@/components/common/error-state"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { LoadingButton } from "@/components/ui/loading-button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { LANGUAGE_NAMES, LANGUAGES } from "@/lib/i18n"
import { useUpdateMe } from "../api/mutations"
import { useMe, useTemplates } from "../api/queries"
import {
  type SettingsFormValues,
  settingsFormSchema,
  toSettingsFormValues,
  toSettingsPayload,
} from "../schemas"

const RESUME_LANGUAGES = ["pt", "en"] as const

export function SettingsPage() {
  const { t } = useTranslation()
  const me = useMe()

  return (
    <div className="flex max-w-xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {t("account.title")}
        </h1>
        <p className="text-muted-foreground">{t("account.description")}</p>
      </div>
      {me.isPending ? (
        <div className="space-y-4" data-testid="settings-skeleton">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
      ) : me.isError ? (
        <ErrorState
          title={t("account.loadError")}
          message={getErrorMessage(me.error, t("errors.unexpected"))}
          onRetry={() => void me.refetch()}
        />
      ) : (
        // A new key remounts the form when another user is loaded, so it
        // never keeps the values of the previous one.
        <SettingsForm key={me.data.user_id} user={me.data} />
      )}
    </div>
  )
}

interface SettingsFormProps {
  user: UserResource
}

function SettingsForm({ user }: SettingsFormProps) {
  const { t, i18n } = useTranslation()
  const templates = useTemplates()
  const updateMe = useUpdateMe()

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: toSettingsFormValues(user),
  })

  // The current template stays selectable while the list loads or if it
  // fails, so the field never shows an empty value.
  const templateNames = Array.from(
    new Set([
      user.default_template,
      ...(templates.data ?? []).map((template) => template.name),
    ]),
  )

  function onSubmit(values: SettingsFormValues) {
    updateMe.mutate(
      { body: toSettingsPayload(values) },
      {
        onSuccess: (updated) => {
          form.reset(toSettingsFormValues(updated))
          if (updated.ui_language !== i18n.language) {
            void i18n.changeLanguage(updated.ui_language)
          }
          toast.success(t("account.toast.saved"))
        },
        onError: (error) =>
          toast.error(getErrorMessage(error, t("errors.unexpected"))),
      },
    )
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        noValidate
        className="space-y-5"
      >
        <FormItem>
          <FormLabel htmlFor="account-email">
            {t("account.fields.email")}
          </FormLabel>
          <Input id="account-email" value={user.email} readOnly disabled />
        </FormItem>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("account.fields.name")}</FormLabel>
              <FormControl>
                <Input autoComplete="name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="ui_language"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("account.fields.uiLanguage")}</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {LANGUAGES.map((language) => (
                    <SelectItem key={language} value={language} lang={language}>
                      {LANGUAGE_NAMES[language]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="resume_language"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("account.fields.resumeLanguage")}</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {RESUME_LANGUAGES.map((language) => (
                    <SelectItem key={language} value={language}>
                      {t(`account.resumeLanguages.${language}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                {t("account.fields.resumeLanguageHint")}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="default_template"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("account.fields.defaultTemplate")}</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {templateNames.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <LoadingButton type="submit" loading={updateMe.isPending}>
          {t("common.save")}
        </LoadingButton>
      </form>
    </Form>
  )
}
