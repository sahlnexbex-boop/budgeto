import React from 'react';
import { StyleSheet, View, ViewStyle, Platform, StyleProp } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

interface GlassCardProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    cornerRadius?: number;
}

/**
 * Standard Material 3 / Pixel Style Card (Permanent Design)
 */
const GlassCard = ({ children, style, cornerRadius = 24 }: GlassCardProps) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <View style={[
            styles.card,
            {
                borderRadius: cornerRadius,
                backgroundColor: isDark ? '#211F26' : '#FFFFFF',
                borderColor: isDark ? '#353439' : '#F0F0F0',
                borderWidth: 1,
            },
            style
        ]}>
            <View style={styles.content}>
                {children}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        overflow: 'hidden',
    },
    content: {
        padding: 24,
    },
});

export default GlassCard;
