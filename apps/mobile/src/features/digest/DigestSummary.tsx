import { useState } from "react";
import { View, Pressable, FlatList, Share } from "react-native";
import { CyberText, CyberButton, CyberIcon } from "@/design-system/primitives";

type Period = "weekly" | "monthly";

interface Stat {
  id: string;
  icon: string;
  label: string;
  weeklyValue: string;
  monthlyValue: string;
}

interface Article {
  id: string;
  rank: number;
  title: string;
  source: string;
}

interface TopicTrend {
  id: string;
  name: string;
  count: number;
  color: string;
}

const STATS: Stat[] = [
  {
    id: "articles",
    icon: "newspaper-outline",
    label: "Articles Read",
    weeklyValue: "42",
    monthlyValue: "168",
  },
  {
    id: "podcasts",
    icon: "headset-outline",
    label: "Podcasts Listened",
    weeklyValue: "7",
    monthlyValue: "28",
  },
  {
    id: "time",
    icon: "time-outline",
    label: "Time Spent",
    weeklyValue: "3h 24m",
    monthlyValue: "14h 12m",
  },
  {
    id: "topics",
    icon: "grid-outline",
    label: "Topics Explored",
    weeklyValue: "5",
    monthlyValue: "8",
  },
];

const TOP_ARTICLES: Article[] = [
  {
    id: "1",
    rank: 1,
    title: "Breakthrough in Quantum Computing Achieves Room Temperature Operation",
    source: "Nature",
  },
  {
    id: "2",
    rank: 2,
    title: "New AI Model Surpasses GPT-4 on Multiple Benchmarks",
    source: "ArXiv",
  },
  {
    id: "3",
    rank: 3,
    title: "CRISPR Gene Therapy Shows Promise in Clinical Trials",
    source: "The Verge",
  },
  {
    id: "4",
    rank: 4,
    title: "SpaceX Successfully Lands Starship After Orbital Flight",
    source: "Hacker News",
  },
  {
    id: "5",
    rank: 5,
    title: "Researchers Develop Carbon-Neutral Concrete Alternative",
    source: "Reddit",
  },
];

const TOPIC_TRENDS: TopicTrend[] = [
  { id: "ai", name: "Artificial Intelligence", count: 24, color: "#00FFFF" },
  { id: "quantum", name: "Quantum Computing", count: 18, color: "#FF00FF" },
  { id: "biotech", name: "Biotechnology", count: 15, color: "#8000FF" },
  { id: "space", name: "Space Exploration", count: 12, color: "#00FFFF" },
  { id: "climate", name: "Climate Tech", count: 9, color: "#FF00FF" },
];

export function DigestSummary() {
  const [period, setPeriod] = useState<Period>("weekly");

  const handleShare = async () => {
    try {
      await Share.share({
        message: `My ${period} AI Digest Summary:\n\nArticles Read: ${period === "weekly" ? "42" : "168"}\nPodcasts Listened: ${period === "weekly" ? "7" : "28"}\nTime Spent: ${period === "weekly" ? "3h 24m" : "14h 12m"}\nTopics Explored: ${period === "weekly" ? "5" : "8"}`,
        title: "AI Digest Summary",
      });
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const maxCount = Math.max(...TOPIC_TRENDS.map((t) => t.count));

  return (
    <View className="flex-1 gap-6 p-4">
      {/* Period Toggle */}
      <View className="flex-row gap-3">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Weekly summary"
          onPress={() => setPeriod("weekly")}
          className={`flex-1 items-center justify-center rounded-card py-3 ${
            period === "weekly" ? "bg-cyber-cyan" : "bg-cyber-surface"
          }`}
        >
          <CyberText
            variant="body-medium"
            className={period === "weekly" ? "text-black" : "text-cyber-text"}
          >
            Weekly
          </CyberText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Monthly summary"
          onPress={() => setPeriod("monthly")}
          className={`flex-1 items-center justify-center rounded-card py-3 ${
            period === "monthly" ? "bg-cyber-cyan" : "bg-cyber-surface"
          }`}
        >
          <CyberText
            variant="body-medium"
            className={period === "monthly" ? "text-black" : "text-cyber-text"}
          >
            Monthly
          </CyberText>
        </Pressable>
      </View>

      {/* Stats Grid */}
      <View className="flex-row flex-wrap gap-3">
        {STATS.map((stat) => (
          <View
            key={stat.id}
            className="flex-1 basis-[48%] gap-2 rounded-card bg-cyber-surface p-4"
          >
            <CyberIcon
              name={stat.icon as any}
              size="md"
              color="#00FFFF"
            />
            <CyberText variant="h3">
              {period === "weekly" ? stat.weeklyValue : stat.monthlyValue}
            </CyberText>
            <CyberText variant="caption">{stat.label}</CyberText>
          </View>
        ))}
      </View>

      {/* Top Articles */}
      <View className="gap-3">
        <CyberText variant="h3">Top Articles</CyberText>
        <FlatList
          data={TOP_ARTICLES}
          scrollEnabled={false}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View className="flex-row gap-3 py-2">
              <CyberText variant="h3" className="text-cyber-cyan">
                {item.rank}
              </CyberText>
              <View className="flex-1">
                <CyberText variant="body-medium">{item.title}</CyberText>
                <CyberText variant="caption">{item.source}</CyberText>
              </View>
            </View>
          )}
          ItemSeparatorComponent={() => <View className="h-px bg-cyber-border" />}
        />
      </View>

      {/* Topic Trends */}
      <View className="gap-3">
        <CyberText variant="h3">Topic Trends</CyberText>
        <View className="gap-2">
          {TOPIC_TRENDS.map((topic) => {
            const widthPercentage = (topic.count / maxCount) * 100;
            return (
              <View key={topic.id} className="gap-1">
                <View className="flex-row items-center justify-between">
                  <CyberText variant="body-small">{topic.name}</CyberText>
                  <CyberText variant="caption">{topic.count}</CyberText>
                </View>
                <View className="h-2 rounded-full bg-cyber-surface">
                  <View
                    style={{
                      width: `${widthPercentage}%`,
                      backgroundColor: topic.color,
                    }}
                    className="h-full rounded-full"
                  />
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* Share Button */}
      <CyberButton
        label="Share Summary"
        variant="primary"
        size="lg"
        onPress={handleShare}
        className="mt-2"
      />
    </View>
  );
}
