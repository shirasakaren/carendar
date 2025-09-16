import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminBanner } from "@/components/admin/AdminBanner";
import { AdminErrorBoundary } from "@/components/admin/AdminErrorBoundary";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      <AdminBanner />
      <AdminErrorBoundary>{children}</AdminErrorBoundary>
    </AdminGuard>
  );
}
