import { redirect } from 'next/navigation';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthThemeToggle } from '@/components/auth-theme-toggle';
import { readStaffSession } from '@/server/auth/session';
import { verifyTotpAction } from '@/server/auth/actions';

type MfaPageProps = {
  searchParams?: Promise<{
    error?: string;
    setup?: string;
    uri?: string;
  }>;
};

export default async function MfaPage({ searchParams }: MfaPageProps) {
  const session = await readStaffSession();
  if (!session?.token) {
    redirect('/auth/sign-in');
  }

  const params = (await searchParams) ?? {};
  const isSetup = params.setup === '1';
  const totpUri = params.uri ? decodeURIComponent(params.uri) : null;

  return (
    <main className="bg-muted/30 flex min-h-screen items-center justify-center p-6">
      <AuthThemeToggle />
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{isSetup ? 'Set Up Two-Factor Auth' : 'Two-Factor Verification'}</CardTitle>
          <CardDescription>
            {isSetup
              ? 'Scan the QR code with your authenticator app, then enter the 6-digit code.'
              : 'Enter the 6-digit code from your authenticator app.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {params.error ? (
            <div className="border-destructive/30 bg-destructive/10 rounded-md border px-3 py-2 text-sm text-destructive">
              {params.error}
            </div>
          ) : null}
          {isSetup && totpUri ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Scan this URI in your authenticator app (Google Authenticator, Authy, 1Password):
              </p>
              <code className="block break-all rounded-md bg-muted p-3 text-xs">{totpUri}</code>
            </div>
          ) : null}
          <form action={verifyTotpAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Verification Code</Label>
              <Input
                id="code"
                name="code"
                data-testid="totp-code-input"
                placeholder="000000"
                maxLength={8}
                autoComplete="one-time-code"
                inputMode="numeric"
                pattern="[0-9a-fA-F]{6,8}"
                required
                autoFocus
              />
            </div>
            <CardFooter className="-mx-4 -mb-4 mt-4">
              <Button className="w-full" type="submit" data-testid="totp-submit">
                Verify
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
