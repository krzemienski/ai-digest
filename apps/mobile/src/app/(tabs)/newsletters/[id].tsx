import { useLocalSearchParams } from "expo-router";
import { NewsletterReader } from "@/features/newsletter/NewsletterReader";

export default function NewsletterDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <NewsletterReader digestId={id ?? ""} />;
}
