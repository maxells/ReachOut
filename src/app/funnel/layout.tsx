import { ProgressBar } from "@/components/funnel/progress-bar";

export default function FunnelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <h1 className="text-xl font-bold tracking-tight">
            Go<span className="text-primary">Famous</span>
          </h1>
        </div>
      </header>
      <div className="mx-auto max-w-4xl px-4 py-8">
        <ProgressBar />
        <div className="mt-8">{children}</div>
      </div>
    </div>
  );
}
