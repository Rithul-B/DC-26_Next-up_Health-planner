import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="space-y-4">
      <h1 className="text-4xl font-semibold tracking-tight">Page not found</h1>
      <p className="text-lg text-muted-foreground">
        That link does not go anywhere in Next Up.
      </p>
      <Button
        nativeButton={false}
        render={<Link href="/" />}
        className="h-12 rounded-2xl text-base"
      >
        Back to Now
      </Button>
    </div>
  );
}
