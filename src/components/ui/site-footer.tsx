const BUG_REPORT_EMAIL = "mapuaapex@gmail.com";

/**
 * Slim, ever-present footer fixed to the bottom of the viewport so it is
 * visible on every screen and never scrolls away. Carries the bug-report
 * entry point as a plain mailto link. Matches the attendance system bar.
 */
export function SiteFooter() {
  return (
    <footer className="fixed inset-x-0 bottom-0 z-30 border-t bg-card">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-center px-4 py-3 text-xs text-muted-foreground sm:px-6">
        <p>
          Email{" "}
          <a
            className="font-medium underline underline-offset-2 hover:text-foreground"
            href={`mailto:${BUG_REPORT_EMAIL}`}
          >
            {BUG_REPORT_EMAIL}
          </a>{" "}
          for bug reports
        </p>
      </div>
    </footer>
  );
}
