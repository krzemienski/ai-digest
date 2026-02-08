import { useCallback, useRef } from "react";
import { View, type LayoutChangeEvent, type GestureResponderEvent } from "react-native";

interface WaveformSeekProps {
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
}

export function WaveformSeek({ currentTime, duration, onSeek }: WaveformSeekProps) {
  const barWidth = useRef(0);

  const percentage = duration > 0 ? Math.min(currentTime / duration, 1) : 0;

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    barWidth.current = e.nativeEvent.layout.width;
  }, []);

  const calculateSeekTime = useCallback(
    (pageX: number, targetRef: View | null) => {
      if (!targetRef || duration <= 0) return;
      targetRef.measure((_x, _y, width, _height, px) => {
        const relativeX = Math.max(0, Math.min(pageX - px, width));
        const seekTime = (relativeX / width) * duration;
        onSeek(seekTime);
      });
    },
    [duration, onSeek],
  );

  const viewRef = useRef<View>(null);

  const handleTouchStart = useCallback(
    (e: GestureResponderEvent) => {
      calculateSeekTime(e.nativeEvent.pageX, viewRef.current);
    },
    [calculateSeekTime],
  );

  const handleTouchMove = useCallback(
    (e: GestureResponderEvent) => {
      calculateSeekTime(e.nativeEvent.pageX, viewRef.current);
    },
    [calculateSeekTime],
  );

  return (
    <View
      ref={viewRef}
      onLayout={handleLayout}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={handleTouchStart}
      onResponderMove={handleTouchMove}
      className="h-10 justify-center px-1"
    >
      <View className="h-1 w-full rounded-full bg-cyber-overlay overflow-hidden flex-row">
        <View
          className="h-full bg-cyber-cyan rounded-full"
          style={{ width: `${percentage * 100}%` }}
        />
      </View>
      <View
        className="absolute w-3 h-3 rounded-full bg-cyber-cyan shadow-neon-cyan"
        style={{ left: `${percentage * 100}%`, marginLeft: -6 }}
      />
    </View>
  );
}
