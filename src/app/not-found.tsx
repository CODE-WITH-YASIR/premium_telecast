import { EmptyState } from "@/components/ui/States";
import { Tv } from "lucide-react";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <EmptyState
        icon={Tv}
        title="Page not found"
        description="The page you're looking for doesn't exist."
        action={{ label: "Back to Home", href: "/" }}
      />
    </div>
  );
}
