import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { getSession } from "@/lib/session";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    redirect("/login");
  }

  if (session.role !== "admin") {
    redirect("/");
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <Sidebar />
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        {children}
      </div>
    </div>
  );
}
