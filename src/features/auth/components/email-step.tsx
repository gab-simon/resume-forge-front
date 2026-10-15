import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { getErrorMessage } from "@/api/errors"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { LoadingButton } from "@/components/ui/loading-button"
import { getLanguage } from "@/lib/i18n"
import { useRequestLoginCode } from "../api/mutations"
import { type EmailFormValues, emailFormSchema } from "../schemas"

interface EmailStepProps {
  onCodeSent: (email: string, challengeId: string) => void
}

export function EmailStep({ onCodeSent }: EmailStepProps) {
  const { t } = useTranslation()
  const requestCode = useRequestLoginCode()

  const form = useForm<EmailFormValues>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: { email: "" },
  })

  function onSubmit({ email }: EmailFormValues) {
    requestCode.mutate(
      // The email is written in the language the page is showing. A new
      // account starts with it as its interface language.
      { body: { email, language: getLanguage() } },
      {
        onSuccess: (challenge) => onCodeSent(email, challenge.challenge_id),
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
        className="space-y-4"
      >
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("auth.email.label")}</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  autoComplete="email"
                  autoFocus
                  placeholder={t("auth.email.placeholder")}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <LoadingButton
          type="submit"
          className="w-full"
          loading={requestCode.isPending}
        >
          {t("auth.email.submit")}
        </LoadingButton>
      </form>
    </Form>
  )
}
