import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, Switch, ScrollView, Platform } from 'react-native';
import SoundButton from '../components/SoundButton';
import { useTheme } from '../theme/ThemeContext';
import Background from '../components/Background';
import { ChevronLeft, Shield, Key, Fingerprint, Database, Smartphone, FileText, CheckCircle2, Lock, Trash2, AlertTriangle } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { dbService } from '../database/db';
import ModalAlert from '../components/ModalAlert';
import * as Haptics from 'expo-haptics';
import * as LocalAuthentication from 'expo-local-authentication';

const SecurityCenter = ({ navigation }: any) => {
    const { colors, theme } = useTheme();
    const isDark = theme === 'dark';

    const [hasPasscode, setHasPasscode] = useState(false);
    const [txCount, setTxCount] = useState(0);
    const [debtCount, setDebtCount] = useState(0);
    const [categoryCount, setCategoryCount] = useState(0);
    const [lastLogin, setLastLogin] = useState<string>('Syncing...');

    // Biometric state variables
    const [useBiometrics, setUseBiometrics] = useState(false);
    const [hasBiometricHardware, setHasBiometricHardware] = useState(false);

    const [alertConfig, setAlertConfig] = useState<{ visible: boolean; title: string; message: string; type: any; onConfirm?: () => void }>({
        visible: false,
        title: '',
        message: '',
        type: 'info'
    });

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', loadSecurityData);
        loadSecurityData();
        return unsubscribe;
    }, [navigation]);

    const loadSecurityData = async () => {
        try {
            // Check passcode status
            const savedPasscode = await AsyncStorage.getItem('user_passcode');
            setHasPasscode(!!savedPasscode);

            // Fetch real DB stats
            const txs = await dbService.getTransactions();
            setTxCount(txs.length);

            const debts = await dbService.getDebts();
            setDebtCount(debts.length);

            const cats = await dbService.getCategories();
            setCategoryCount(cats.length);

            // Login info
            const date = new Date();
            setLastLogin(date.toLocaleString());

            // Biometrics config
            const bioState = await AsyncStorage.getItem('use_biometrics');
            setUseBiometrics(bioState === 'true');

            // Detect hardware
            const compatible = await LocalAuthentication.hasHardwareAsync();
            setHasBiometricHardware(compatible);

        } catch (error) {
            console.error(error);
        }
    };

    const toggleBiometrics = async () => {
        if (!hasPasscode) {
            setAlertConfig({ visible: true, title: 'Passcode Required', message: 'You must set up an App Passcode before enabling Biometric unlock.', type: 'error' });
            return;
        }

        if (!useBiometrics) {
            const hasRecords = await LocalAuthentication.isEnrolledAsync();
            if (!hasRecords) {
                setAlertConfig({ visible: true, title: 'Not Configured', message: 'No biometric records (Face/Fingerprint) are enrolled on this device natively.', type: 'error' });
                return;
            }

            const auth = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Authenticate to enable Biometrics',
                fallbackLabel: 'Cancel',
                cancelLabel: 'Cancel',
                disableDeviceFallback: true,
            });

            if (auth.success) {
                await AsyncStorage.setItem('use_biometrics', 'true');
                setUseBiometrics(true);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => { });
            }
        } else {
            // Disabling
            await AsyncStorage.setItem('use_biometrics', 'false');
            setUseBiometrics(false);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
        }
    };



    const handleRemovePasscode = () => {
        setAlertConfig({
            visible: true,
            title: 'Remove App Lock?',
            message: 'Are you sure you want to remove the passcode? Anyone with access to your device will be able to see your financial flows.',
            type: 'confirm',
            onConfirm: async () => {
                await AsyncStorage.removeItem('user_passcode');
                setHasPasscode(false);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => { });
                setAlertConfig({ ...alertConfig, visible: false });
            }
        });
    };

    const StatBox = ({ title, value, icon: Icon, color }: any) => (
        <View style={[styles.statBox, { backgroundColor: colors.card }]}>
            <View style={[styles.statIconFrame, { backgroundColor: color + '20' }]}>
                <Icon size={20} color={color} />
            </View>
            <View>
                <Text style={[styles.statValue, { color: colors.onSurface }]}>{value}</Text>
                <Text style={[styles.statTitle, { color: colors.onSurfaceVariant }]}>{title}</Text>
            </View>
        </View>
    );

    return (
        <Background>
            <View style={styles.header}>
                <SoundButton onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ChevronLeft color={colors.onSurface} size={28} />
                </SoundButton>
                <Text style={[styles.title, { color: colors.onSurface }]}>Security Center</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                {/* Status Hero */}
                <View style={[styles.heroCard, { backgroundColor: colors.primary }]}>
                    <View style={styles.heroTop}>
                        <Shield size={48} color={colors.onPrimary} />
                        <View style={styles.heroText}>
                            <Text style={[styles.heroTitle, { color: colors.onPrimary }]}>System Secured</Text>
                            <Text style={[styles.heroSub, { color: colors.onPrimary, opacity: 0.8 }]}>Data is encrypted locally</Text>
                        </View>
                    </View>
                    <View style={[styles.deviceInfo, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                        <Smartphone size={16} color={colors.onPrimary} />
                        <Text style={[styles.deviceText, { color: colors.onPrimary }]}>Current Device • Active since {lastLogin.split(',')[0]}</Text>
                    </View>
                </View>

                {/* Storage & Data Health */}
                <Text style={[styles.sectionTitle, { color: colors.primary }]}>Data Vault Integrity</Text>
                <View style={styles.grid}>
                    <StatBox title="Flow Records" value={txCount} icon={FileText} color="#146C2E" />
                    <StatBox title="Debt Contracts" value={debtCount} icon={Database} color="#B3261E" />
                    <StatBox title="Identities" value={categoryCount} icon={CheckCircle2} color={colors.primary} />
                    <StatBox title="Encryption" value="AES-256" icon={Lock} color="#6750A4" />
                </View>

                {/* Access Controls */}
                <Text style={[styles.sectionTitle, { color: colors.primary, marginTop: 16 }]}>Access Controls</Text>

                <View style={[styles.menuList, { backgroundColor: colors.surface }]}>
                    <SoundButton style={[styles.menuItem, { borderBottomColor: colors.outline }]} onPress={() => navigation.navigate('ChangePasscode')}>
                        <View style={[styles.iconBg, { backgroundColor: colors.primaryContainer }]}>
                            <Key size={20} color={colors.primary} />
                        </View>
                        <View style={styles.menuTextContent}>
                            <Text style={[styles.menuTitle, { color: colors.onSurface }]}>
                                {hasPasscode ? 'Change App Passcode' : 'Setup App Passcode'}
                            </Text>
                            <Text style={[styles.menuSub, { color: colors.onSurfaceVariant }]}>
                                {hasPasscode ? 'Active and protecting data' : 'Not configured'}
                            </Text>
                        </View>
                        <ChevronLeft style={{ transform: [{ rotate: '180deg' }] }} color={colors.onSurfaceVariant} size={20} />
                    </SoundButton>

                    <SoundButton
                        style={[styles.menuItem, { borderBottomColor: colors.outline }]}
                        onPress={toggleBiometrics}
                    >
                        <View style={[styles.iconBg, { backgroundColor: colors.card }]}>
                            <Fingerprint size={20} color={colors.primary} />
                        </View>
                        <View style={styles.menuTextContent}>
                            <Text style={[styles.menuTitle, { color: colors.onSurface }]}>Biometric Gateway</Text>
                            <Text style={[styles.menuSub, { color: colors.onSurfaceVariant }]}>
                                {useBiometrics ? 'Secured by Biometrics' : 'Use device Face ID / Fingerprint'}
                            </Text>
                        </View>
                        <Switch value={useBiometrics} onValueChange={toggleBiometrics} trackColor={{ false: colors.outline, true: colors.primary }} />
                    </SoundButton>

                    {hasPasscode && (
                        <SoundButton style={[styles.menuItem, { borderBottomWidth: 0 }]} onPress={handleRemovePasscode}>
                            <View style={[styles.iconBg, { backgroundColor: 'rgba(179,38,30,0.1)' }]}>
                                <Lock size={20} color="#B3261E" />
                            </View>
                            <View style={styles.menuTextContent}>
                                <Text style={[styles.menuTitle, { color: '#B3261E' }]}>Disable App Lock</Text>
                                <Text style={[styles.menuSub, { color: colors.onSurfaceVariant }]}>Remove passcode requirement</Text>
                            </View>
                            <AlertTriangle color="#B3261E" size={20} />
                        </SoundButton>
                    )}
                </View>

            </ScrollView>

            <ModalAlert
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
                confirmText={alertConfig.type === 'confirm' ? 'Confirm' : 'OK'}
                onClose={() => setAlertConfig({ ...alertConfig, visible: false })}
                onConfirm={alertConfig.onConfirm}
            />
        </Background>
    );
};

const styles = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 },
    backBtn: { padding: 4, marginRight: 12 },
    title: { fontSize: 24, fontWeight: '400', letterSpacing: -0.5 },
    content: { padding: 20, paddingBottom: 100 },

    heroCard: { padding: 24, borderRadius: 28, elevation: 8, marginBottom: 32 },
    heroTop: { flexDirection: 'row', alignItems: 'center', gap: 20, marginBottom: 24 },
    heroText: { flex: 1 },
    heroTitle: { fontSize: 24, fontWeight: '600', marginBottom: 4 },
    heroSub: { fontSize: 14, fontWeight: '500' },
    deviceInfo: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 16 },
    deviceText: { fontSize: 13, fontWeight: '600' },

    sectionTitle: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 16, paddingHorizontal: 4 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 32 },
    statBox: { width: '48%', padding: 16, borderRadius: 24, flexDirection: 'row', alignItems: 'center', gap: 12 },
    statIconFrame: { width: 44, height: 44, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    statValue: { fontSize: 18, fontWeight: '700', marginBottom: 2 },
    statTitle: { fontSize: 12, fontWeight: '500' },

    menuList: { borderRadius: 28, overflow: 'hidden', elevation: 2 },
    menuItem: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1 },
    iconBg: { width: 44, height: 44, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    menuTextContent: { flex: 1 },
    menuTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
    menuSub: { fontSize: 13 }
});

export default SecurityCenter;
