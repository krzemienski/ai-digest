import { View } from "react-native";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAudioStore } from "@/stores/audio-store";
import { MiniPlayer } from "@/features/podcast/MiniPlayer";

export default function TabLayout() {
  const currentEpisode = useAudioStore((s) => s.currentEpisode);
  const isPlaying = useAudioStore((s) => s.isPlaying);
  const expandPlayer = useAudioStore((s) => s.expandPlayer);
  const pause = useAudioStore((s) => s.pause);
  const resume = useAudioStore((s) => s.resume);

  return (
    <View className="flex-1">
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: "#00FFFF",
          tabBarInactiveTintColor: "#A0A0B0",
          tabBarStyle: {
            backgroundColor: "rgba(10, 10, 15, 0.9)",
            borderTopColor: "rgba(0, 255, 255, 0.1)",
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 80,
            paddingBottom: 24,
            paddingTop: 8,
            borderTopWidth: 1,
          },
          tabBarLabelStyle: {
            fontFamily: "Inter_500Medium",
            fontSize: 11,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="podcasts"
          options={{
            title: "Podcasts",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="headset-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            title: "Search",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="search-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="newsletters"
          options={{
            title: "Newsletters",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="newspaper-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person-outline" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
      {currentEpisode && (
        <View className="absolute bottom-20 left-0 right-0">
          <MiniPlayer
            onPress={expandPlayer}
            onPlayPause={() => (isPlaying ? pause() : resume())}
          />
        </View>
      )}
    </View>
  );
}
