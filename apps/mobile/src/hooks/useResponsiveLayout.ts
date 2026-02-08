import { useWindowDimensions } from "react-native";

export type LayoutMode = "mobile" | "tablet" | "desktop";

interface ResponsiveLayout {
  mode: LayoutMode;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  width: number;
  columns: number;
}

export function useResponsiveLayout(): ResponsiveLayout {
  const { width } = useWindowDimensions();

  const mode: LayoutMode = width >= 1024 ? "desktop" : width >= 768 ? "tablet" : "mobile";

  return {
    mode,
    isMobile: mode === "mobile",
    isTablet: mode === "tablet",
    isDesktop: mode === "desktop",
    width,
    columns: mode === "desktop" ? 3 : mode === "tablet" ? 2 : 1,
  };
}
