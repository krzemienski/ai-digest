import { View } from "react-native";
import { TopicChip } from "@/design-system/composites";

const TOPICS = [
  "AI",
  "Machine Learning",
  "Web Dev",
  "Mobile",
  "Security",
  "Data Science",
  "DevOps",
  "Cloud",
  "Blockchain",
  "Robotics",
] as const;

interface TopicSelectorProps {
  selectedTopics: string[];
  onToggle: (topic: string) => void;
}

export function TopicSelector({ selectedTopics, onToggle }: TopicSelectorProps) {
  return (
    <View className="flex-row flex-wrap gap-3">
      {TOPICS.map((topic) => (
        <TopicChip
          key={topic}
          label={topic}
          selected={selectedTopics.includes(topic)}
          onToggle={() => onToggle(topic)}
        />
      ))}
    </View>
  );
}
