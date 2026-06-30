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
import { sendStaffOtpAction, verifyStaffOtpAction } from '@/server/auth/actions';
import { AuthThemeToggle } from '@/components/auth-theme-toggle';

type SignInPageProps = {
  searchParams?: Promise<{
    error?: string;
    phone?: string;
    sent?: string;
  }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = (await searchParams) ?? {};

  return (
    <main className="bg-muted/30 flex min-h-screen items-center justify-center p-6">
      <AuthThemeToggle />
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Staff Sign In</CardTitle>
          <CardDescription>Only approved staff phone numbers can continue.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {params.error ? (
            <div className="border-destructive/30 bg-destructive/10 rounded-md border px-3 py-2 text-sm text-destructive">
              {params.error}
            </div>
          ) : null}
          {params.sent ? (
            <div className="rounded-md border bg-muted px-3 py-2 text-sm text-muted-foreground">
              Staff OTP requested. Enter the code to continue to two-factor verification.
            </div>
          ) : null}
          <form action={sendStaffOtpAction} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="phone-send">Phone</Label>
              <Input
                id="phone-send"
                name="phone"
                data-testid="admin-phone-input"
                placeholder="+1 (___) ___-____"
                defaultValue={params.phone ?? ''}
                autoComplete="tel"
                required
              />
            </div>
            <Button
              className="w-full"
              variant="outline"
              type="submit"
              data-testid="admin-submit-phone"
            >
              Send code
            </Button>
          </form>
          <form action={verifyStaffOtpAction} className="space-y-3">
            {params.phone ? (
              <input type="hidden" name="phone" value={params.phone} />
            ) : (
              <div className="space-y-2">
                <Label htmlFor="phone-verify">Approved phone</Label>
                <Input
                  id="phone-verify"
                  name="phone"
                  placeholder="+1 (___) ___-____"
                  autoComplete="tel"
                  required
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="code">One-time code</Label>
              <Input
                id="code"
                name="code"
                data-testid="admin-otp-input"
                placeholder="000000"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
              />
            </div>
            <CardFooter className="-mx-4 -mb-4 mt-4">
              <Button className="w-full" type="submit" data-testid="admin-submit-otp">
                Continue
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
