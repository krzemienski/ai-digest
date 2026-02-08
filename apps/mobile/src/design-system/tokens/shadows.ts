import { Platform } from "react-native";

const createNeonShadow = (r: number, g: number, b: number) => {
  if (Platform.OS === "web") {
    return `0 0 10px rgba(${r}, ${g}, ${b}, 0.3), 0 0 20px rgba(${r}, ${g}, ${b}, 0.1)`;
  }
  return {
    shadowColor: `rgb(${r}, ${g}, ${b})`,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  };
};

export const shadows = {
  neonCyan: createNeonShadow(0, 255, 255),
  neonCyanStrong: (() => {
    if (Platform.OS === "web") {
      return "0 0 15px rgba(0, 255, 255, 0.5), 0 0 30px rgba(0, 255, 255, 0.2)";
    }
    return {
      shadowColor: "rgb(0, 255, 255)",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 15,
      elevation: 12,
    };
  })(),
  neonMagenta: createNeonShadow(255, 0, 102),
  neonGreen: createNeonShadow(0, 255, 136),
  neonPurple: createNeonShadow(139, 92, 246),
} as const;
