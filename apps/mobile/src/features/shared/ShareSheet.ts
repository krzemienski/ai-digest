import { Share } from "react-native";

export async function shareContent(title: string, url?: string): Promise<void> {
  await Share.share({
    message: url ? `${title}\n${url}` : title,
    title,
  });
}
