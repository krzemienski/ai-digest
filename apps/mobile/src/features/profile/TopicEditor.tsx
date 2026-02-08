import { View } from "react-native";
import { TopicChip } from "@/design-system/composites";

const AVAILABLE_TOPICS = [
  "AI",
  "Machine Learning",
  "Web Dev",
  "Mobile",
  "Security",
  "Data Science",
  "DevOps",
  "Cloud",
];

interface TopicEditorProps {
  selectedTopics: string[];
  onTopicsChange: (topics: string[]) => void;
}

export function TopicEditor({ selectedTopics, onTopicsChange }: TopicEditorProps) {
  const handleToggle = (topic: string) => {
    const newTopics = selectedTopics.includes(topic)
      ? selectedTopics.filter((t) => t !== topic)
      : [...selectedTopics, topic];
    onTopicsChange(newTopics);
  };

  return (
    <View className="flex-row flex-wrap gap-2">
      {AVAILABLE_TOPICS.map((topic) => (
        <TopicChip
          key={topic}
          label={topic}
          selected={selectedTopics.includes(topic)}
          onToggle={() => handleToggle(topic)}
        />
      ))}
    </View>
  );
}
