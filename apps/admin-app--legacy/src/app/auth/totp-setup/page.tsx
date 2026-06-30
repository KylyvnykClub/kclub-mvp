import { redirect } from 'next/navigation';
import Image from 'next/image';

import { Badge } from '@/components/ui/badge';
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
import { verifyStaffTotpAction, setupStaffTotpAction } from '@/server/auth/actions';
import { renderTotpQrDataUrl } from '@/server/totp-qr';
import { AuthThemeToggle } from '@/components/auth-theme-toggle';

type TotpSetupPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function TotpSetupPage({ searchParams }: TotpSetupPageProps) {
  const params = (await searchParams) ?? {};

  const setupData = await setupStaffTotpAction();

  if (!setupData) {
    redirect('/auth/2fa-required');
  }

  const qrDataUrl = await renderTotpQrDataUrl(setupData.provisioningUri);

  return (
    <main className="bg-muted/30 flex min-h-screen items-center justify-center p-6">
      <AuthThemeToggle />
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2">
          <Badge variant="secondary" className="w-fit">
            Setup Required
          </Badge>
          <CardTitle>Set up two-factor authentication</CardTitle>
          <CardDescription>
            Scan the QR code with your authenticator app, or enter the key manually.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {params.error ? (
            <div className="border-destructive/30 bg-destructive/10 rounded-md border px-3 py-2 text-sm text-destructive">
              {params.error}
            </div>
          ) : null}

          <div className="flex flex-col items-center gap-4">
            <div className="rounded-lg border bg-white p-4">
              <Image
                src={qrDataUrl}
                alt="TOTP QR Code"
                width={256}
                height={256}
                className="h-auto w-full"
              />
            </div>

            <div className="w-full space-y-2">
              <Label className="text-xs text-muted-foreground">Manual entry key</Label>
              <div className="bg-muted/50 select-all break-all rounded-md border px-3 py-2 font-mono text-sm">
                {setupData.manualKey}
              </div>
            </div>
          </div>

          <form action={verifyStaffTotpAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="totp">Verification code</Label>
              <Input
                id="totp"
                name="code"
                placeholder="123456"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
              />
            </div>
            <CardFooter className="-mx-4 -mb-4">
              <Button className="w-full" type="submit">
                Verify and complete setup
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
