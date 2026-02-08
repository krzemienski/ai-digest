import { useLocalSearchParams } from "expo-router";
import { DigestDetail } from "@/features/digest/DigestDetail";

export default function DigestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <DigestDetail digestId={id ?? ""} />;
}
