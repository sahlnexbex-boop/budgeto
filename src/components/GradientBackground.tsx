import React from 'react';
import { StyleSheet, View, Platform, StatusBar } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

interface GradientBackgroundProps {
    children: React.ReactNode;
}

/**
 * Material 3 Surface Background
 */
const GradientBackground = ({ children }: GradientBackgroundProps) => {
    const { theme, colors } = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: theme === 'dark' ? '#1C1B1F' : '#FFFBFE' }]}>
            <StatusBar
                barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
                backgroundColor="transparent"
                translucent
            />
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});

export default GradientBackground;
