import React from 'react';
import { StyleSheet, View, Text, ScrollView, Image, Linking, Share } from 'react-native';
import SoundButton from '../components/SoundButton';
import { useTheme } from '../theme/ThemeContext';
import Background from '../components/Background';
import { ChevronLeft, Star, Share2, Shield, FileText, Mail, Code, ExternalLink } from 'lucide-react-native';

const AboutBudgeto = ({ navigation }: any) => {
    const { colors, theme } = useTheme();

    const openLink = (url: string) => {
        Linking.openURL(url).catch((err) => console.error("Couldn't load page", err));
    };

    const handleShare = async () => {
        try {
            await Share.share({
                message: 'Check out Budgeto — a secure, offline-first personal finance tracker! Download it today at https://budgetodev.com',
            });
        } catch (error) {
            console.error(error);
        }
    };

    const ListItem = ({ title, subtitle, icon: Icon, isLink = false, onPress }: any) => (
        <SoundButton style={[styles.listItem, { borderBottomColor: colors.outline }]} onPress={onPress}>
            <Icon size={22} color={colors.onSurfaceVariant} style={styles.listIcon} />
            <View style={{ flex: 1 }}>
                <Text style={[styles.listLabel, { color: colors.onSurface }]}>{title}</Text>
                {subtitle && <Text style={[styles.listSub, { color: colors.onSurfaceVariant }]}>{subtitle}</Text>}
            </View>
            {isLink && <ExternalLink size={16} color={colors.onSurfaceVariant} opacity={0.5} />}
        </SoundButton>
    );

    return (
        <Background>
            <View style={styles.header}>
                <SoundButton onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ChevronLeft color={colors.onSurface} size={28} />
                </SoundButton>
                <Text style={[styles.title, { color: colors.onSurface }]}>About Budgeto</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                <View style={styles.logoSection}>
                    <View style={[styles.logoContainer, { elevation: 8, shadowColor: colors.primary }]}>
                        <Image source={require('../../assets/icon.png')} style={styles.logoImage} />
                    </View>
                    <Text style={[styles.appName, { color: colors.onSurface }]}>Budgeto</Text>
                    <Text style={[styles.appVersion, { color: colors.primary }]}>Version 2.3.0</Text>
                </View>

                <View style={[styles.listContainer, { backgroundColor: colors.surface }]}>
                    <ListItem title="Rate Budgeto" subtitle="Love the app? Leave a review" icon={Star} onPress={() => openLink('market://details?id=com.budgeto')} />
                    <ListItem title="Share with Friends" subtitle="Recommend us to others" icon={Share2} onPress={handleShare} />
                    <ListItem title="Contact Support" subtitle="Get help or suggest features" icon={Mail} onPress={() => openLink('mailto:support@budgetodev.com?subject=Budgeto%20Support')} />
                </View>

                <Text style={[styles.sectionTitle, { color: colors.primary, marginTop: 24 }]}>Legal & Info</Text>
                <View style={[styles.listContainer, { backgroundColor: colors.surface }]}>
                    <ListItem title="Privacy Policy" icon={Shield} isLink onPress={() => openLink('https://budgetodev.com/privacy')} />
                    <ListItem title="Terms of Service" icon={FileText} isLink onPress={() => openLink('https://budgetodev.com/terms')} />
                    <ListItem title="Open Source Licenses" icon={Code} isLink onPress={() => openLink('https://budgetodev.com/licenses')} />
                </View>

                <View style={styles.footer}>
                    <Text style={[styles.footerText, { color: colors.onSurfaceVariant }]}>Budgeto is a secure, local-first finance tracker.</Text>
                    <Text style={[styles.footerText, { color: colors.onSurfaceVariant, marginTop: 4 }]}>&copy; 2024 Budgeto Team.</Text>
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

    logoSection: { alignItems: 'center', marginBottom: 32 },
    logoContainer: { width: 100, height: 100, borderRadius: 24, overflow: 'hidden', marginBottom: 16 },
    logoImage: { width: '100%', height: '100%' },
    appName: { fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
    appVersion: { fontSize: 14, fontWeight: '500' },

    sectionTitle: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12, paddingHorizontal: 16 },

    listContainer: { borderRadius: 24, overflow: 'hidden', elevation: 2 },
    listItem: { flexDirection: 'row', alignItems: 'center', padding: 18, borderBottomWidth: 1 },
    listIcon: { marginRight: 16 },
    listLabel: { fontSize: 16, fontWeight: '500', marginBottom: 2 },
    listSub: { fontSize: 13 },

    footer: { marginTop: 40, alignItems: 'center', paddingHorizontal: 20 },
    footerText: { fontSize: 12, textAlign: 'center', lineHeight: 20, opacity: 0.6 }
});

export default AboutBudgeto;
