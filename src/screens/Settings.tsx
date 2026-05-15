import React, { useState } from 'react';
import { StyleSheet, View, Text, Switch, ScrollView, Platform, Modal, Image, Pressable } from 'react-native';
import SoundButton from '../components/SoundButton';
import { useTheme } from '../theme/ThemeContext';
import { ColorThemeType, BaseThemeColors } from '../theme/colors';
import Background from '../components/Background';
import { ChevronRight, Shield, Database, Palette, Info, Moon, Sun, Trash2, Key, Check, Globe, Sparkles, Landmark } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { dbService } from '../database/db';
import { useNavigation } from '@react-navigation/native';
import ModalAlert from '../components/ModalAlert';

const Settings = () => {
    const { theme, setTheme, colorTheme, setColorTheme, colors, currency, setCurrency, soundEnabled, setSoundEnabled } = useTheme();
    const isDark = theme === 'dark';
    const navigation = useNavigation<any>();

    const [alertConfig, setAlertConfig] = useState<{ visible: boolean; title: string; message: string; type: any; onConfirm?: () => void }>({
        visible: false,
        title: '',
        message: '',
        type: 'info'
    });

    const [showThemeModal, setShowThemeModal] = useState(false);
    const [showCurrencyModal, setShowCurrencyModal] = useState(false);

    const currencies = [
        { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
        { code: 'USD', symbol: '$', name: 'US Dollar' },
        { code: 'EUR', symbol: '€', name: 'Euro' },
        { code: 'GBP', symbol: '£', name: 'British Pound' },
        { code: 'JPY', symbol: '¥', name: 'Japanese Yen' }
    ];

    const themes = [
        { id: 'light', name: 'Light Flow', icon: Sun },
        { id: 'dark', name: 'Deep Space', icon: Moon }
    ];

    const colorPresets = [
        { id: 'purple', name: 'Royal Purple', color: BaseThemeColors.purple },
        { id: 'ocean', name: 'Ocean Breeze', color: BaseThemeColors.ocean },
        { id: 'yellow', name: 'Golden Sun', color: BaseThemeColors.yellow },
        { id: 'ruby', name: 'Ruby Dark', color: BaseThemeColors.ruby }
    ];

    const handleWipeRequest = () => {
        setAlertConfig({
            visible: true,
            title: 'Nuke Everything?',
            message: 'This will permanently delete all your financial flows and categories. This action is irreversible.',
            type: 'confirm',
            onConfirm: async () => {
                await dbService.wipeData();
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => { });
                setAlertConfig({
                    visible: true,
                    title: 'System Reset',
                    message: 'Flow data has been cleared. The system will now refresh.',
                    type: 'success',
                    onConfirm: () => {
                        if (Platform.OS === 'web') window.location.reload();
                        else setAlertConfig({ ...alertConfig, visible: false });
                    }
                });
            }
        });
    };

    const handleExportData = async () => {
        try {
            const dataStr = await dbService.exportDatabaseJson();
            if (Platform.OS === 'web') {
                const blob = new Blob([dataStr], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Budgeto_Backup_${Date.now()}.json`;
                a.click();
            } else {
                const fileUri = FileSystem.documentDirectory + `Budgeto_Backup_${Date.now()}.json`;
                await FileSystem.writeAsStringAsync(fileUri, dataStr, { encoding: FileSystem.EncodingType.UTF8 });
                await Sharing.shareAsync(fileUri);
            }
            setAlertConfig({
                visible: true,
                title: 'Export Successful',
                message: 'Your financial data has been packaged securely.',
                type: 'success'
            });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => { });
        } catch (error) {
            console.error("Export error", error);
        }
    };

    const handleImportData = async () => {
        try {
            if (Platform.OS === 'web') {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.json,application/json';
                input.onchange = (e: any) => {
                    const file = e.target.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = async (event) => {
                            try {
                                await dbService.importDatabaseJson(event.target?.result as string);
                                window.location.reload();
                            } catch (e) {
                                alert("Invalid backup file.");
                            }
                        };
                        reader.readAsText(file);
                    }
                };
                input.click();
            } else {
                const result = await DocumentPicker.getDocumentAsync({
                    type: ['application/json', 'text/plain', '*/*'],
                    copyToCacheDirectory: true
                });
                if (result.canceled) return;

                const fileUri = result.assets[0].uri;
                const jsonString = await FileSystem.readAsStringAsync(fileUri, { encoding: FileSystem.EncodingType.UTF8 });

                await dbService.importDatabaseJson(jsonString);

                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => { });
                setAlertConfig({
                    visible: true,
                    title: 'Import Successful',
                    message: 'Your backup has been restored. Restart the app or refresh for changes to take full effect.',
                    type: 'success'
                });
            }
        } catch (error) {
            console.error("Import error", error);
            setAlertConfig({
                visible: true,
                title: 'Import Failed',
                message: 'Could not restore backup. Invalid format or corrupted file.',
                type: 'error'
            });
        }
    };

    const SettingItem = ({ icon: Icon, title, subtitle, value, onPress, danger }: any) => (
        <SoundButton
            style={styles.item}
            onPress={onPress}
        >
            <View style={[styles.itemIcon, { backgroundColor: danger ? 'rgba(179, 38, 30, 0.1)' : (isDark ? '#2B2930' : '#F3EDF7') }]}>
                <Icon size={20} color={danger ? '#B3261E' : (isDark ? '#D0BCFF' : '#6750A4')} />
            </View>
            <View style={styles.itemText}>
                <Text style={[styles.itemTitle, { color: danger ? '#B3261E' : (isDark ? '#E6E1E5' : '#1C1B1F') }]}>{title}</Text>
                {subtitle && <Text style={[styles.itemSubtitle, { color: isDark ? '#CAC4D0' : '#49454F' }]}>{subtitle}</Text>}
            </View>
            <View style={styles.itemRight}>
                {value && <Text style={[styles.itemValue, { color: isDark ? '#D0BCFF' : '#6750A4' }]}>{value}</Text>}
                <ChevronRight size={18} color={isDark ? '#CAC4D0' : '#49454F'} />
            </View>
        </SoundButton>
    );

    return (
        <Background>
            <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <Text style={[styles.title, { color: isDark ? '#E6E1E5' : '#1C1B1F' }]}>Settings</Text>

                <View style={styles.section}>
                    <Text style={[styles.sectionHeader, { color: colors.primary }]}>Appearance</Text>
                    <SettingItem
                        icon={isDark ? Moon : Sun}
                        title="App Theme"
                        subtitle="Change the visual style"
                        value={isDark ? 'Deep Space' : 'Light Flow'}
                        onPress={() => setShowThemeModal(true)}
                    />
                    <SettingItem
                        icon={Palette}
                        title="Manage Categories"
                        subtitle="Customize icons and colors"
                        onPress={() => navigation.navigate('ManageCategories')}
                    />
                    <SettingItem
                        icon={Landmark}
                        title="Manage Accounts"
                        subtitle="Create and customize vaults"
                        onPress={() => navigation.navigate('ManageAccounts')}
                    />
                    <SettingItem
                        icon={Globe}
                        title="Currency"
                        subtitle="Default trading currency"
                        value={currency}
                        onPress={() => setShowCurrencyModal(true)}
                    />
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionHeader, { color: colors.primary }]}>Security & Privacy</Text>
                    <SettingItem
                        icon={Shield}
                        title="Security Center"
                        subtitle="Manage passcodes and active encrypted vaults"
                        onPress={() => navigation.navigate('SecurityCenter')}
                    />
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionHeader, { color: colors.primary }]}>General</Text>
                    <SettingItem
                        icon={Info}
                        title="About Budgeto"
                        subtitle="Version 2.3.0 - Feedback & Legal"
                        onPress={() => navigation.navigate('AboutBudgeto')}
                    />
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionHeader, { color: colors.primary }]}>Data Management</Text>
                    <SettingItem
                        icon={Database}
                        title="Export Financial Flow"
                        subtitle="Save all records as a backup file"
                        onPress={handleExportData}
                    />
                    <SettingItem
                        icon={Sparkles}
                        title="Restore Backup"
                        subtitle="Import data from a previous backup file"
                        onPress={handleImportData}
                    />
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionHeader, { color: colors.primary }]}>Danger Zone</Text>
                    <SettingItem
                        icon={Trash2}
                        title="Wipe Data"
                        subtitle="Clear all transactions and history"
                        onPress={handleWipeRequest}
                        danger
                    />
                </View>
            </ScrollView>

            <Modal visible={showThemeModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowThemeModal(false)} />
                    <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.modalTitle, { color: colors.onSurface }]}>Select Theme</Text>
                        {themes.map((t) => (
                            <SoundButton
                                key={t.id}
                                style={[styles.selectBox, { borderBottomColor: colors.outline }]}
                                onPress={() => { setTheme(t.id as any); setShowThemeModal(false); }}
                            >
                                <t.icon size={20} color={colors.primary} />
                                <Text style={[styles.selectText, { color: colors.onSurface }]}>{t.name}</Text>
                                {(theme === t.id) && <Check color={colors.primary} size={20} />}
                            </SoundButton>
                        ))}
                        <Text style={[styles.modalTitle, { color: colors.onSurface, marginTop: 24 }]}>Accent Color</Text>
                        <View style={styles.colorGrid}>
                            {colorPresets.map((p) => (
                                <SoundButton
                                    key={p.id}
                                    style={[
                                        styles.colorCircle,
                                        { backgroundColor: p.color },
                                        colorTheme === p.id && { borderWidth: 3, borderColor: colors.onSurface }
                                    ]}
                                    onPress={() => setColorTheme(p.id as any)}
                                />
                            ))}
                        </View>

                        <SoundButton style={styles.modalClose} onPress={() => setShowThemeModal(false)}>
                            <Text style={{ color: colors.primary, fontWeight: 'bold' }}>Done</Text>
                        </SoundButton>
                    </View>
                </View>
            </Modal>

            <Modal visible={showCurrencyModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowCurrencyModal(false)} />
                    <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.modalTitle, { color: colors.onSurface }]}>Select Currency</Text>
                        <ScrollView style={{ maxHeight: 400 }}>
                            {currencies.map((c) => (
                                <SoundButton
                                    key={c.code}
                                    style={[styles.selectBox, { borderBottomColor: colors.outline }]}
                                    onPress={() => { setCurrency(c.code); setShowCurrencyModal(false); }}
                                >
                                    <View style={[styles.currencyIcon, { backgroundColor: colors.card }]}>
                                        <Text style={{ color: colors.primary, fontWeight: 'bold' }}>{c.symbol}</Text>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.selectText, { color: colors.onSurface }]}>{c.code}</Text>
                                        <Text style={{ color: colors.onSurfaceVariant, fontSize: 12 }}>{c.name}</Text>
                                    </View>
                                    {currency === c.code && <Check color={colors.primary} size={20} />}
                                </SoundButton>
                            ))}
                        </ScrollView>
                        <SoundButton style={styles.modalClose} onPress={() => setShowCurrencyModal(false)}>
                            <Text style={{ color: colors.primary, fontWeight: 'bold' }}>Cancel</Text>
                        </SoundButton>
                    </View>
                </View>
            </Modal>

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
    container: { flex: 1 },
    content: { paddingBottom: 120 },
    title: { fontSize: 32, fontWeight: '400', padding: 24, paddingTop: 60, letterSpacing: -0.5 },
    section: { marginBottom: 32 },
    sectionHeader: { fontSize: 13, fontWeight: '700', paddingHorizontal: 24, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1.5 },
    item: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 18 },
    itemIcon: { width: 44, height: 44, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    itemText: { flex: 1 },
    itemTitle: { fontSize: 16, fontWeight: '500' },
    itemSubtitle: { fontSize: 13, marginTop: 2, fontWeight: '400' },
    itemRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    itemValue: { fontSize: 14, fontWeight: '500' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    modalCard: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, elevation: 12 },
    modalTitle: { fontSize: 24, fontWeight: '400', marginBottom: 24 },
    selectBox: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, gap: 16 },
    selectText: { fontSize: 16, flex: 1 },
    modalClose: { marginTop: 24, paddingTop: 16, alignItems: 'center' },
    currencyIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    colorGrid: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
    colorCircle: { width: 48, height: 48, borderRadius: 24, elevation: 2 }
});

export default Settings;
