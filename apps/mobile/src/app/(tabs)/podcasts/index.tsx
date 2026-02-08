import { ScreenLayout } from "@/design-system/layouts";
import { EpisodeList } from "@/features/podcast/EpisodeList";

export default function PodcastsScreen() {
  return (
    <ScreenLayout>
      <EpisodeList />
    </ScreenLayout>
  );
}
