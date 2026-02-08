import { ConfigForm } from "@/components/admin/config-form";

export default function ConfigPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-accent mb-6">Analysis Configuration</h1>
      <ConfigForm />
    </div>
  );
}
