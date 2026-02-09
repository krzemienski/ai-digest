import { ConfigForm } from "@/components/admin/config-form";
import { ApiKeysManager } from "@/components/admin/api-keys-manager";

export default function ConfigPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-accent mb-6">Configuration</h1>
      <div className="space-y-8">
        <ApiKeysManager />
        <ConfigForm />
      </div>
    </div>
  );
}
