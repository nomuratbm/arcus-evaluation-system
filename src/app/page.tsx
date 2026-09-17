import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-4 py-16 sm:px-6">
      <p className="text-xs tracking-wide text-muted-foreground uppercase">
        Arcus Evaluation System
      </p>
      <h1 className="mt-2 max-w-xl text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
        Student activity evaluations
      </h1>
      <p className="mt-3 max-w-lg text-base leading-relaxed text-muted-foreground">
        Capture feedback on Office of Student Affairs programs and activities
        using the FM-SA-05-01 evaluation form.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Button render={<Link href="/forms" />}>Open evaluation form</Button>
        <Button variant="outline" render={<Link href="/officer" />}>
          Officer dashboard
        </Button>
        <Button variant="ghost" render={<Link href="/export" />}>
          Data export
        </Button>
      </div>
    </main>
  );
}
