import { useEffect, useState, useCallback } from "react";
import { View, ActivityIndicator, Pressable, Linking } from "react-native";
import {
  CyberText,
  CyberButton,
  CyberCard,
  CyberBadge,
  CyberIcon,
  CyberDivider,
} from "@/design-system/primitives";
import { ScreenLayout } from "@/design-system/layouts";
import { api } from "@/services/api-endpoints";
import { formatDate } from "@/utils/format";
import { shareContent } from "@/features/shared/ShareSheet";
import type { Digest, DigestItem } from "@ai-digest/shared";

interface NewsletterReaderProps {
  digestId: string;
}

function NewsletterItemCard({ item }: { item: DigestItem }) {
  const normalizedItem = item.item;
  const source = normalizedItem.source;
  const title = normalizedItem.title;
  const summary = normalizedItem.summary;
  const sourceUrl = normalizedItem.sourceUrl;

  const handleOpenLink = useCallback(() => {
    if (sourceUrl) {
      void Linking.openURL(sourceUrl);
    }
  }, [sourceUrl]);

  return (
    <CyberCard className="mb-3">
      <Pressable onPress={handleOpenLink}>
        <CyberText variant="h3" className="mb-1">
          {title}
        </CyberText>
      </Pressable>
      <View className="flex-row items-center gap-2 mb-2">
        <CyberBadge variant="tag" color="blue" label={source} />
        {item.section ? (
          <CyberBadge variant="tag" color="purple" label={item.section} />
        ) : null}
      </View>
      <CyberText variant="body-small" className="mb-2">
        {summary}
      </CyberText>
      {sourceUrl ? (
        <Pressable onPress={handleOpenLink} className="flex-row items-center gap-1">
          <CyberIcon name="open-outline" size="sm" color="#00FFFF" />
          <CyberText variant="caption" className="text-cyber-cyan">
            Read source
          </CyberText>
        </Pressable>
      ) : null}
    </CyberCard>
  );
}

export function NewsletterReader({ digestId }: NewsletterReaderProps) {
  const [digest, setDigest] = useState<(Digest & { items: DigestItem[] }) | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    if (!digestId) return;

    async function loadDigest() {
      setIsLoading(true);
      setError(null);
      const res = await api.getDigest(digestId);
      if (res.success && res.data) {
        setDigest(res.data);
      } else {
        setError(res.error ?? "Failed to load newsletter");
      }
      setIsLoading(false);
    }

    void loadDigest();
  }, [digestId]);

  const handleShare = useCallback(() => {
    if (!digest) return;
    const title = `AI Digest Newsletter - ${formatDate(digest.digestDate)}`;
    void shareContent(title);
  }, [digest]);

  const handleBookmark = useCallback(() => {
    setBookmarked((prev) => !prev);
  }, []);

  const handleRetry = useCallback(() => {
    if (!digestId) return;
    setIsLoading(true);
    setError(null);
    void api.getDigest(digestId).then((res) => {
      if (res.success && res.data) {
        setDigest(res.data);
      } else {
        setError(res.error ?? "Failed to load newsletter");
      }
      setIsLoading(false);
    });
  }, [digestId]);

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

  if (!digest) {
    return (
      <ScreenLayout>
        <View className="flex-1 items-center justify-center">
          <CyberText variant="body" className="text-cyber-text-secondary">
            Newsletter not found
          </CyberText>
        </View>
      </ScreenLayout>
    );
  }

  const items = digest.items ?? [];

  return (
    <ScreenLayout scrollable edges={["left", "right", "bottom"]}>
      <View className="px-4 pt-4 pb-24">
        {/* Title */}
        <CyberText variant="h1" className="mb-2">
          AI Digest Newsletter
        </CyberText>

        {/* Date + Item count */}
        <View className="flex-row items-center mb-3 gap-3">
          <CyberText variant="caption">
            {formatDate(digest.digestDate)}
          </CyberText>
          <CyberBadge
            variant="status"
            color="blue"
            label={`${digest.itemCount} items`}
          />
        </View>

        {/* Synthesis / Summary */}
        <CyberText variant="body" className="mb-4">
          {digest.synthesis}
        </CyberText>

        <CyberDivider glow="cyan" className="mb-4" />

        {/* Items list */}
        <CyberText variant="h2" className="mb-3">
          Stories
        </CyberText>
        {items.map((item) => (
          <NewsletterItemCard key={item.id} item={item} />
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
