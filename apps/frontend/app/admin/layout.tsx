import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminBanner } from "@/components/admin/AdminBanner";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      <AdminBanner />
      {children}
    </AdminGuard>
  );
}
