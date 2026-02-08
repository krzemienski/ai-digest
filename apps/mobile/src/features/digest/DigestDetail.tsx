import { useEffect, useState, useCallback } from "react";
import { ScrollView, View, ActivityIndicator, Pressable } from "react-native";
import {
  CyberText,
  CyberButton,
  CyberCard,
  CyberBadge,
  CyberIcon,
  CyberDivider,
} from "@/design-system/primitives";
import { ScreenLayout } from "@/design-system/layouts";
import { useDigestStore } from "@/stores/digest-store";
import { formatDate } from "@/utils/format";
import { shareContent } from "@/features/shared/ShareSheet";
import type { DigestItem } from "@ai-digest/shared";

interface DigestDetailProps {
  digestId: string;
}

function getCategoryColor(section: string): "purple" | "blue" | "green" | "amber" | "magenta" {
  const colorMap: Record<string, "purple" | "blue" | "green" | "amber" | "magenta"> = {
    AI: "purple",
    ML: "blue",
    Web: "green",
    Mobile: "amber",
    Security: "magenta",
    Data: "blue",
  };
  return colorMap[section] ?? "purple";
}

function DigestItemCard({ item }: { item: DigestItem }) {
  const normalizedItem = item.item;
  const source = normalizedItem.source;
  const title = normalizedItem.title;
  const summary = normalizedItem.summary;
  const category = item.section;

  return (
    <CyberCard className="mb-3">
      <CyberText variant="h3" className="mb-1">
        {title}
      </CyberText>
      <CyberText variant="caption" className="mb-2">
        {source}
      </CyberText>
      <CyberText variant="body-small" numberOfLines={4} className="mb-2">
        {summary}
      </CyberText>
      {category ? (
        <CyberBadge variant="tag" color={getCategoryColor(category)} label={category} />
      ) : null}
    </CyberCard>
  );
}

export function DigestDetail({ digestId }: DigestDetailProps) {
  const [bookmarked, setBookmarked] = useState(false);

  const currentDigest = useDigestStore((s) => s.currentDigest);
  const isLoading = useDigestStore((s) => s.isLoading);
  const error = useDigestStore((s) => s.error);
  const fetchDigest = useDigestStore((s) => s.fetchDigest);

  useEffect(() => {
    if (digestId) {
      void fetchDigest(digestId);
    }
  }, [digestId, fetchDigest]);

  const handleShare = useCallback(() => {
    if (!currentDigest) return;
    const title = `AI Digest - ${formatDate(currentDigest.digestDate)}`;
    void shareContent(title);
  }, [currentDigest]);

  const handleBookmark = useCallback(() => {
    setBookmarked((prev) => !prev);
  }, []);

  const handleRetry = useCallback(() => {
    if (digestId) {
      void fetchDigest(digestId);
    }
  }, [digestId, fetchDigest]);

  if (isLoading) {
    return (
      <ScreenLayout>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#00FFFF" />
        </View>
      </ScreenLayout>
    );
  }

  if (error) {
    return (
      <ScreenLayout>
        <View className="flex-1 items-center justify-center px-6">
          <CyberText variant="h3" className="mb-2 text-center">
            Something went wrong
          </CyberText>
          <CyberText variant="body" className="text-cyber-text-secondary mb-4 text-center">
            {error}
          </CyberText>
          <CyberButton label="Retry" onPress={handleRetry} />
        </View>
      </ScreenLayout>
    );
  }

  if (!currentDigest) {
    return (
      <ScreenLayout>
        <View className="flex-1 items-center justify-center">
          <CyberText variant="body" className="text-cyber-text-secondary">
            Digest not found
          </CyberText>
        </View>
      </ScreenLayout>
    );
  }

  const items = currentDigest.items ?? [];

  return (
    <ScreenLayout scrollable edges={["left", "right", "bottom"]}>
      <View className="px-4 pt-4 pb-24">
        {/* Title */}
        <CyberText variant="h1" className="mb-2">
          AI Digest - {formatDate(currentDigest.digestDate)}
        </CyberText>

        {/* Date + Item count */}
        <View className="flex-row items-center mb-3 gap-3">
          <CyberText variant="caption">
            {formatDate(currentDigest.digestDate)}
          </CyberText>
          <CyberBadge
            variant="status"
            color="blue"
            label={`${currentDigest.itemCount} items`}
          />
        </View>

        {/* Summary */}
        <CyberText variant="body" className="mb-4">
          {currentDigest.synthesis}
        </CyberText>

        <CyberDivider glow="cyan" className="mb-4" />

        {/* Items list */}
        {items.map((item) => (
          <DigestItemCard key={item.id} item={item} />
        ))}

        {/* Action row */}
        <View className="flex-row items-center justify-center gap-4 mt-4">
          <CyberButton
            variant="ghost"
            label="Share"
            size="md"
            onPress={handleShare}
          />
          <Pressable
            onPress={handleBookmark}
            className="flex-row items-center gap-1 px-3 py-2"
          >
            <CyberIcon
              name={bookmarked ? "star" : "star-outline"}
              size="md"
              color={bookmarked ? "#00FFFF" : "#8888AA"}
            />
            <CyberText
              variant="body-small"
              className={bookmarked ? "text-cyber-cyan" : "text-cyber-text-secondary"}
            >
              {bookmarked ? "Bookmarked" : "Bookmark"}
            </CyberText>
          </Pressable>
        </View>
      </View>
    </ScreenLayout>
  );
}
