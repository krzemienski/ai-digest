import { DashboardStats } from "@/components/admin/dashboard-stats";
import { DashboardActions } from "@/components/admin/dashboard-actions";

export default function AdminDashboardPage() {
  return (
    <div>
      <h1 className="font-mono text-2xl font-bold text-cyber-cyan mb-6">Dashboard</h1>
      <DashboardStats />
      <DashboardActions />
    </div>
  );
}
