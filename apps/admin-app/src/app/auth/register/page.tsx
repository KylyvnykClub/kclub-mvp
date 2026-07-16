import Link from 'next/link';

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
import { registerStaffPasswordAction } from '@/server/auth/actions';

type RegisterPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const params = (await searchParams) ?? {};

  return (
    <main className="bg-muted/30 flex min-h-screen items-center justify-center p-6">
      <AuthThemeToggle />
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Register Staff Password</CardTitle>
          <CardDescription>
            Only phone numbers approved by an OWNER can create a password.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {params.error ? (
            <div className="border-destructive/30 bg-destructive/10 rounded-md border px-3 py-2 text-sm text-destructive">
              {params.error}
            </div>
          ) : null}
          <form action={registerStaffPasswordAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Approved phone</Label>
              <Input
                id="phone"
                name="phone"
                placeholder="+1 (___) ___-____"
                autoComplete="tel"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">New password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={10}
                required
              />
            </div>
            <CardFooter className="-mx-4 -mb-4 mt-4 flex-col gap-3">
              <Button className="w-full" type="submit">
                Register password
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Already registered?{' '}
                <Link href="/auth/sign-in" className="font-medium text-primary hover:underline">
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
