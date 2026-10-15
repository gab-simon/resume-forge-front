import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { getErrorMessage } from "@/api/errors"
import { Button } from "@/components/ui/button"
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
import { getLanguage, isLanguage } from "@/lib/i18n"
import { useRequestLoginCode, useVerifyLoginCode } from "../api/mutations"
import { useAuthSession } from "../api/session-context"
import {
  type CodeFormInput,
  type CodeFormValues,
  codeFormSchema,
} from "../schemas"

interface CodeStepProps {
  email: string
  challengeId: string
  onResent: (challengeId: string) => void
  onChangeEmail: () => void
  onSignedIn: () => void
}

export function CodeStep({
  email,
  challengeId,
  onResent,
  onChangeEmail,
  onSignedIn,
}: CodeStepProps) {
  const { t, i18n } = useTranslation()
  const session = useAuthSession()
  const verifyCode = useVerifyLoginCode()
  const requestCode = useRequestLoginCode()

  const form = useForm<CodeFormInput, unknown, CodeFormValues>({
    resolver: zodResolver(codeFormSchema),
    defaultValues: { code: "" },
  })

  const onError = (error: unknown) =>
    toast.error(getErrorMessage(error, t("errors.unexpected")))

  function onSubmit({ code }: CodeFormValues) {
    verifyCode.mutate(
      {
        path: { challenge_id: challengeId },
        body: { code, device_id: session.deviceId, platform: "web" },
      },
      {
        onSuccess: (issued) => {
          // The account remembers its interface language, so the user sees
          // the same language on every device.
          if (isLanguage(issued.user.ui_language)) {
            void i18n.changeLanguage(issued.user.ui_language)
          }
          onSignedIn()
        },
        onError: (error) => {
          form.resetField("code")
          onError(error)
        },
      },
    )
  }

  function resend() {
    requestCode.mutate(
      { body: { email, language: getLanguage() } },
      {
        onSuccess: (challenge) => {
          form.resetField("code")
          toast.success(t("auth.code.resent"))
          onResent(challenge.challenge_id)
        },
        onError,
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
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("auth.code.label")}</FormLabel>
              <FormControl>
                <Input
                  autoComplete="one-time-code"
                  inputMode="numeric"
                  autoFocus
                  maxLength={12}
                  placeholder="000000"
                  className="text-center font-mono text-lg tracking-[0.5em]"
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
          loading={verifyCode.isPending}
        >
          {t("auth.code.submit")}
        </LoadingButton>
        <div className="flex justify-between gap-2">
          <Button
            type="button"
            variant="link"
            className="px-0"
            onClick={onChangeEmail}
          >
            {t("auth.code.changeEmail")}
          </Button>
          <LoadingButton
            type="button"
            variant="link"
            className="px-0"
            loading={requestCode.isPending}
            onClick={resend}
          >
            {t("auth.code.resend")}
          </LoadingButton>
        </div>
      </form>
    </Form>
  )
}
