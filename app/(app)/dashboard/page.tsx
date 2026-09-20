import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { PageContainer, PageHeader } from "@/components/page";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await requireUser();

  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title={`Hi, ${user.name}`}
        description="Your dashboard will show stats and activity here."
      />
      <Button asChild>
        <Link href="/clashes">Browse clashes</Link>
      </Button>
    </PageContainer>
  );
}
