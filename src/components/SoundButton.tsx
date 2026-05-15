import React from 'react';
import { Pressable, ViewStyle, StyleProp, GestureResponderEvent, PressableProps } from 'react-native';
import { audioService } from '../utils/audioService';
import * as Haptics from 'expo-haptics';

interface SoundButtonProps extends PressableProps {
    activeOpacity?: number;
    withHaptics?: boolean;
    hapticStyle?: Haptics.ImpactFeedbackStyle;
}

const SoundButton: React.FC<SoundButtonProps> = ({
    onPress,
    children,
    style,
    activeOpacity = 0.7,
    withHaptics = true,
    hapticStyle = Haptics.ImpactFeedbackStyle.Light,
    disabled = false,
    ...props
}) => {
    const handlePress = (event: GestureResponderEvent) => {
        if (disabled) return;
        audioService.playClick().catch(() => { });
        if (withHaptics) {
            Haptics.impactAsync(hapticStyle).catch(() => { });
        }
        if (onPress) {
            onPress(event);
        }
    };

    return (
        <Pressable
            {...props}
            disabled={disabled}
            onPress={handlePress}
            style={({ pressed }) => [
                style as any,
                { opacity: pressed ? activeOpacity : 1 }
            ]}
        >
            {children}
        </Pressable>
    );
};

export default SoundButton;
