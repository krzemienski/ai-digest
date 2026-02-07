import { ConfigForm } from "@/components/admin/config-form";

export default function ConfigPage() {
  return (
    <div>
      <h1 className="font-mono text-2xl font-bold text-cyber-cyan mb-6">Analysis Configuration</h1>
      <ConfigForm />
    </div>
  );
}
