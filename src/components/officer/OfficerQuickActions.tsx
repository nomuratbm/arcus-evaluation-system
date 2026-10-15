import Link from "next/link";
import { DownloadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function OfficerQuickActions() {
  return <nav aria-label="Officer quick actions" className="flex flex-wrap gap-3">
    <Button variant="outline" render={<Link href="/export" />}><DownloadIcon aria-hidden />Export evaluations</Button>
  </nav>;
}
