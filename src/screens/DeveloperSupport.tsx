import React from 'react';
import { StyleSheet, View, Text, ScrollView, Linking, Image } from 'react-native';
import SoundButton from '../components/SoundButton';
import { useTheme } from '../theme/ThemeContext';
import Background from '../components/Background';
import { ChevronLeft, Coffee, Heart, Code, Link as LinkIcon, Sparkles } from 'lucide-react-native';

const DeveloperSupport = ({ navigation }: any) => {
    const { colors, theme } = useTheme();

    const openLink = (url: string) => {
        Linking.openURL(url).catch(() => console.error("Couldn't open link"));
    };

    const DonationCard = ({ icon: Icon, title, description, badgeColor, onPress }: any) => (
        <SoundButton style={[styles.donationCard, { backgroundColor: colors.surface, borderColor: colors.outline }]} onPress={onPress}>
            <View style={[styles.iconBox, { backgroundColor: badgeColor + '20' }]}>
                <Icon color={badgeColor} size={24} />
            </View>
            <View style={styles.cardContent}>
                <Text style={[styles.cardTitle, { color: colors.onSurface }]}>{title}</Text>
                <Text style={[styles.cardDesc, { color: colors.onSurfaceVariant }]}>{description}</Text>
            </View>
            <ChevronLeft style={{ transform: [{ rotate: '180deg' }] }} color={colors.outline} size={20} />
        </SoundButton>
    );

    return (
        <Background>
            <View style={styles.header}>
                <SoundButton onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ChevronLeft color={colors.onSurface} size={28} />
                </SoundButton>
                <Text style={[styles.title, { color: colors.onSurface }]}>Developer Support</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                <View style={styles.heroSection}>
                    <View style={[styles.heroIconFrame, { backgroundColor: colors.primaryContainer }]}>
                        <Heart color={colors.primary} size={48} fill={colors.primary} />
                        <Sparkles color={colors.onPrimaryContainer} size={20} style={styles.sparkleIcon} />
                    </View>
                    <Text style={[styles.heroTitle, { color: colors.onSurface }]}>Fuel the Development</Text>
                    <Text style={[styles.heroSub, { color: colors.onSurfaceVariant }]}>
                        Budgeto is built with passion and completely ad-free. If this app has helped you organize your life, consider buying me a coffee or supporting future updates!
                    </Text>
                </View>

                <View style={styles.tierContainer}>
                    <DonationCard
                        icon={Coffee}
                        title="Buy me a Coffee"
                        description="Support via UPI (PhonePe, GPay, Paytm)"
                        badgeColor="#8D6E63"
                        onPress={() => openLink('upi://pay?pa=7034887478@fam&pn=Budgeto%20Developer&cu=INR')}
                    />

                    <DonationCard
                        icon={LinkIcon}
                        title="Visit my Portfolio"
                        description="Check out my other open-source projects"
                        badgeColor="#3F51B5"
                        onPress={() => openLink('https://adnanc.vercel.app/')}
                    />
                </View>

                <View style={[styles.quoteCard, { backgroundColor: colors.primary }]}>
                    <Text style={[styles.quoteText, { color: colors.onPrimary }]}>
                        "Open source is love made visible. Thank you for making independent development possible."
                    </Text>
                </View>
            </ScrollView>
        </Background>
    );
};

const styles = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 },
    backBtn: { padding: 4, marginRight: 12 },
    title: { fontSize: 24, fontWeight: '400', letterSpacing: -0.5 },
    content: { padding: 20, paddingBottom: 100 },

    heroSection: { alignItems: 'center', marginBottom: 40, marginTop: 20 },
    heroIconFrame: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 20, position: 'relative' },
    sparkleIcon: { position: 'absolute', top: 10, right: 10 },
    heroTitle: { fontSize: 28, fontWeight: '700', marginBottom: 12, textAlign: 'center' },
    heroSub: { fontSize: 15, textAlign: 'center', lineHeight: 24, paddingHorizontal: 20 },

    tierContainer: { gap: 16, marginBottom: 40 },
    donationCard: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 24, borderWidth: 1 },
    iconBox: { width: 50, height: 50, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    cardContent: { flex: 1 },
    cardTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
    cardDesc: { fontSize: 13, lineHeight: 18 },

    quoteCard: { padding: 24, borderRadius: 28, alignItems: 'center', elevation: 4 },
    quoteText: { fontSize: 16, fontWeight: '500', fontStyle: 'italic', textAlign: 'center', lineHeight: 24 }
});

export default DeveloperSupport;
