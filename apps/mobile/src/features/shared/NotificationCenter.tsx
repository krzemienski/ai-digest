import { View, FlatList, Pressable } from "react-native";
import { useState } from "react";
import { CyberText, CyberButton, CyberIcon } from "@/design-system/primitives";
import type Ionicons from "@expo/vector-icons/Ionicons";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

interface Notification {
  id: string;
  type: "digest" | "podcast" | "system" | "developer";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

const PLACEHOLDER_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    type: "digest",
    title: "New Digest Available",
    message: "Your daily AI digest is ready",
    timestamp: "2h ago",
    read: false,
  },
  {
    id: "2",
    type: "podcast",
    title: "New Episode",
    message: "Episode 42: The Future of AI",
    timestamp: "5h ago",
    read: false,
  },
  {
    id: "3",
    type: "system",
    title: "Welcome!",
    message: "Welcome to AI Digest",
    timestamp: "1d ago",
    read: true,
  },
];

const notificationIcons: Record<Notification["type"], IoniconsName> = {
  digest: "newspaper-outline",
  podcast: "headset-outline",
  system: "information-circle-outline",
  developer: "code-slash-outline",
};

export function NotificationCenter() {
  const [notifications, setNotifications] = useState(PLACEHOLDER_NOTIFICATIONS);

  const handleMarkAllRead = () => {
    setNotifications((prev) =>
      prev.map((notification) => ({ ...notification, read: true }))
    );
  };

  const handleNotificationPress = (notification: Notification) => {
    // Mark as read when pressed
    setNotifications((prev) =>
      prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
    );
    // TODO: Navigate to relevant content based on notification.type
  };

  const renderNotification = ({ item }: { item: Notification }) => {
    const accentColor = item.type === "developer" ? "#E879F9" : "#00D9FF";

    return (
      <Pressable
        onPress={() => handleNotificationPress(item)}
        accessibilityRole="button"
        accessibilityLabel={`${item.title} notification`}
      >
        <View className="flex-row items-start gap-3 p-4 border-b border-cyber-border">
          <View className="pt-1">
            <CyberIcon
              name={notificationIcons[item.type]}
              size="md"
              color={accentColor}
            />
          </View>

          <View className="flex-1 gap-1">
            <View className="flex-row items-center gap-2">
              <CyberText variant="body-medium" className="flex-1">
                {item.title}
              </CyberText>
              {!item.read && (
                <View
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: accentColor }}
                  accessibilityLabel="Unread notification"
                />
              )}
            </View>

            <CyberText variant="body-small" className="text-cyber-text-secondary">
              {item.message}
            </CyberText>

            <CyberText variant="caption" className="text-cyber-text-tertiary">
              {item.timestamp}
            </CyberText>
          </View>
        </View>
      </Pressable>
    );
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <View className="flex-1">
      {/* Header */}
      <View className="px-6 py-4 border-b border-cyber-border flex-row items-center justify-between">
        <View>
          <CyberText variant="h2">Notifications</CyberText>
          {unreadCount > 0 && (
            <CyberText variant="caption" className="text-cyber-text-tertiary">
              {unreadCount} unread
            </CyberText>
          )}
        </View>
        {unreadCount > 0 && (
          <CyberButton
            variant="ghost"
            label="Mark all read"
            onPress={handleMarkAllRead}
          />
        )}
      </View>

      {/* Notification List */}
      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: notifications.length === 0 ? 1 : undefined,
        }}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center px-8">
            <CyberIcon
              name="notifications-outline"
              size="lg"
              color="#555570"
            />
            <CyberText
              variant="body"
              className="text-center text-cyber-text-secondary mt-4"
            >
              No notifications yet
            </CyberText>
          </View>
        }
      />
    </View>
  );
}
