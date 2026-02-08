import React, { useCallback, useMemo, useRef } from "react";
import { View } from "react-native";
import BottomSheet, {
  BottomSheetView,
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import { colors } from "@/design-system/tokens";

interface ModalLayoutProps {
  snapPoints?: (string | number)[];
  children: React.ReactNode;
  onClose?: () => void;
}

export function ModalLayout({
  snapPoints: snapPointsProp,
  children,
  onClose,
}: ModalLayoutProps) {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(
    () => snapPointsProp ?? ["50%", "90%"],
    [snapPointsProp]
  );

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        opacity={0.6}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
      />
    ),
    []
  );

  const handleSheetChanges = useCallback(
    (index: number) => {
      if (index === -1 && onClose) {
        onClose();
      }
    },
    [onClose]
  );

  return (
    <BottomSheet
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={{ backgroundColor: colors.cyber.overlay }}
      backgroundStyle={{ backgroundColor: colors.cyber.surface }}
    >
      <BottomSheetView className="flex-1">
        <View className="flex-1 bg-cyber-surface px-4 pb-4">{children}</View>
      </BottomSheetView>
    </BottomSheet>
  );
}
