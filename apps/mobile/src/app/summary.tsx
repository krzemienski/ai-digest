import { ScreenLayout } from "@/design-system/layouts";
import { DigestSummary } from "@/features/digest/DigestSummary";

export default function SummaryScreen() {
  return (
    <ScreenLayout scrollable>
      <DigestSummary />
    </ScreenLayout>
  );
}
