import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import SoundButton from '../components/SoundButton';
import { useTheme } from '../theme/ThemeContext';
import Background from '../components/Background';
import { ChevronLeft, BellOff } from 'lucide-react-native';

const ReminderSettings = ({ navigation }: any) => {
    const { theme, colors } = useTheme();
    const isDark = theme === 'dark';

    return (
        <Background>
            <View style={styles.container}>
                <View style={styles.header}>
                    <SoundButton onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <ChevronLeft color={isDark ? '#E6E1E5' : '#1C1B1F'} size={24} />
                    </SoundButton>
                    <Text style={[styles.title, { color: isDark ? '#E6E1E5' : '#1C1B1F' }]}>Reminders</Text>
                </View>

                <View style={styles.content}>
                    <View style={styles.empty}>
                        <BellOff color={isDark ? '#49454F' : '#CAC4D0'} size={64} strokeWidth={1} />
                        <Text style={[styles.emptyTitle, { color: colors.onSurface }]}>Feature Disabled</Text>
                        <Text style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
                            Native reminders are disabled in this "Slim" version of Budgeto to maintain the smallest possible app size.
                        </Text>
                        <SoundButton
                            style={[styles.backButton, { backgroundColor: colors.primary }]}
                            onPress={() => navigation.goBack()}
                        >
                            <Text style={{ color: colors.onPrimary, fontWeight: 'bold' }}>Go Back</Text>
                        </SoundButton>
                    </View>
                </View>
            </View>
        </Background>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, paddingTop: 60 },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 24, gap: 16 },
    backBtn: { padding: 4 },
    title: { fontSize: 24, fontWeight: '400' },
    content: { flex: 1, paddingHorizontal: 20, justifyContent: 'center' },
    empty: { alignItems: 'center', gap: 16, padding: 20 },
    emptyTitle: { fontSize: 20, fontWeight: '600', marginTop: 8 },
    emptyText: { fontSize: 15, textAlign: 'center', lineHeight: 22, opacity: 0.8 },
    backButton: { marginTop: 20, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 20 }
});

export default ReminderSettings;
