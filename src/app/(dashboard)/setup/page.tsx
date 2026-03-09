import { Rocket } from "lucide-react";

export default function SetupPage() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
      <div className="mx-auto max-w-2xl text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Rocket className="h-8 w-8" />
        </div>
        <h1 className="mt-6 text-3xl font-bold text-foreground">
          Setup My Business
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          In just 5 steps, we&apos;ll build your entire knowledge business — products,
          storefront, and marketing. Let&apos;s go!
        </p>
        <div className="mt-8 text-sm text-muted-foreground">
          The full setup wizard will be available in Milestone 3.
        </div>
      </div>
    </div>
  );
}
