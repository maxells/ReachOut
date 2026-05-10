import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <h1 className="text-xl font-bold tracking-tight">
            Reach<span className="text-primary">Out</span>
          </h1>
          <Link href="/funnel">
            <Button>Get Started</Button>
          </Link>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
            AI-Powered Influencer Outreach
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Find, match, and reach out to the perfect creators for your brand.
            Our AI agent acts as your strategist — not just a database.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link href="/funnel">
              <Button size="lg">Start Your Campaign</Button>
            </Link>
          </div>
        </div>
      </main>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        <p>ReachOut — Built for the Hackathon</p>
      </footer>
    </div>
  );
}
