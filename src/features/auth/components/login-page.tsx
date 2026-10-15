import { useState } from "react"
import { useTranslation } from "react-i18next"
import { APP_NAME } from "@/config/app"
import { CodeStep } from "./code-step"
import { EmailStep } from "./email-step"
import { LoginLanguageSwitcher } from "./login-language-switcher"

interface LoginPageProps {
  /** Called after the code is verified and the session is stored. */
  onSignedIn: () => void
}

interface Challenge {
  email: string
  challengeId: string
}

export function LoginPage({ onSignedIn }: LoginPageProps) {
  const { t } = useTranslation()
  // The challenge exists only during this visit: a reload starts over, and
  // the back end lets the user ask for a new code.
  const [challenge, setChallenge] = useState<Challenge | null>(null)

  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-sm space-y-6 rounded-xl border bg-background p-6 shadow-sm">
        <div className="space-y-1 text-center">
          <p className="text-sm font-medium text-muted-foreground">
            {APP_NAME}
          </p>
          <h1 className="text-2xl font-bold tracking-tight">
            {challenge ? t("auth.code.title") : t("auth.email.title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {challenge
              ? t("auth.code.description", { email: challenge.email })
              : t("auth.email.description")}
          </p>
        </div>
        {challenge ? (
          <CodeStep
            email={challenge.email}
            challengeId={challenge.challengeId}
            onResent={(challengeId) =>
              setChallenge({ email: challenge.email, challengeId })
            }
            onChangeEmail={() => setChallenge(null)}
            onSignedIn={onSignedIn}
          />
        ) : (
          <EmailStep
            onCodeSent={(email, challengeId) =>
              setChallenge({ email, challengeId })
            }
          />
        )}
        <LoginLanguageSwitcher />
      </div>
    </main>
  )
}
