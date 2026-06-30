import Link from 'next/link';
import { FileQuestion } from 'lucide-react';

import { buttonVariants } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function NotFound() {
  return (
    <main className="bg-muted/30 flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <FileQuestion className="h-6 w-6 text-muted-foreground" />
          </div>
          <CardTitle>Page not found</CardTitle>
          <CardDescription>The page you&apos;re looking for doesn&apos;t exist.</CardDescription>
        </CardHeader>
        <CardContent className="text-center text-sm text-muted-foreground">
          Check the URL or navigate back to the dashboard.
        </CardContent>
        <CardFooter className="justify-center">
          <Link href="/dashboard" className={buttonVariants()}>
            Go to dashboard
          </Link>
        </CardFooter>
      </Card>
    </main>
  );
}
