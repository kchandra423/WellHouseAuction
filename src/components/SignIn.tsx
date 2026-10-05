import { devSignInAction, signInAction } from "@/app/actions";
import { devLoginEnabled } from "@/auth";
import { Button, Card, Notice } from "./ui";

export function SignIn({ error }: { error?: string }) {
  return (
    <div className="mx-auto max-w-md space-y-4 pt-8 text-center">
      <h1 className="text-2xl font-semibold">Bring a guest to dinner</h1>
      <p className="text-neutral-600">
        Each Well House meal has 5 guest spots. Everyone gets 100 Well Dollars per quarter to bid on them.
      </p>
      {error && (
        <Notice kind="error">
          {error === "AccessDenied"
            ? "That account can't sign in. Use your @stanford.edu Google account. If you already did, ask the house admin to add you to the residents list."
            : "Something went wrong signing in. Please try again."}
        </Notice>
      )}
      <Card className="space-y-3">
        <form action={signInAction}>
          <Button className="w-full text-lg">Sign in with Stanford Google</Button>
        </form>
        <p className="text-xs text-neutral-500">Use your @stanford.edu account.</p>
      </Card>
      {devLoginEnabled && (
        <Card className="space-y-2 border-dashed text-left">
          <p className="text-xs font-medium text-neutral-500">DEV ONLY (hidden in production): sign in as anyone</p>
          <form action={devSignInAction} className="flex gap-2">
            <input name="email" defaultValue="test1@stanford.edu" className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm" />
            <Button variant="secondary" className="text-sm">Dev sign in</Button>
          </form>
        </Card>
      )}
    </div>
  );
}
