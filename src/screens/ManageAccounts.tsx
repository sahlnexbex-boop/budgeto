import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TextInput, Modal, FlatList, Dimensions, KeyboardAvoidingView, Platform, Switch } from 'react-native';
import SoundButton from '../components/SoundButton';
import { useTheme } from '../theme/ThemeContext';
import Background from '../components/Background';
import { ChevronLeft, Plus, Trash2, Edit2, Check, X, Wallet, CreditCard, Landmark, Coins, Globe, Smartphone, CircleDollarSign } from 'lucide-react-native';
import { CATEGORY_ICONS } from '../utils/iconLibrary';
import { dbService } from '../database/db';
import * as Haptics from 'expo-haptics';
import ModalAlert from '../components/ModalAlert';

const { width } = Dimensions.get('window');

const ManageAccounts = ({ navigation }: any) => {
    const { colors, theme, currency: defaultCurrency } = useTheme();
    const isDark = theme === 'dark';

    const [accounts, setAccounts] = useState<any[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    const [name, setName] = useState('');
    const [type, setType] = useState('cash');
    const [balance, setBalance] = useState('');
    const [currency, setCurrency] = useState('INR');
    const [selectedIcon, setSelectedIcon] = useState('wallet');
    const [showIconPicker, setShowIconPicker] = useState(false);
    const [includeInTotal, setIncludeInTotal] = useState(true);

    const [alertConfig, setAlertConfig] = useState<{ visible: boolean; title: string; message: string; type: any; onConfirm?: () => void }>({
        visible: false,
        title: '',
        message: '',
        type: 'info'
    });

    const ACCOUNT_TYPES = [
        { id: 'cash', label: 'Cash', icon: Wallet },
        { id: 'upi', label: 'UPI / Digital', icon: Smartphone },
        { id: 'debit', label: 'Debit Card', icon: CreditCard },
        { id: 'credit', label: 'Credit Card', icon: CreditCard },
        { id: 'landmark', label: 'Bank Account', icon: Landmark },
        { id: 'savings', label: 'Savings', icon: CircleDollarSign },
        { id: 'virtual', label: 'Virtual Wallet', icon: Coins },
    ];

    const CURRENCIES = [
        { code: 'INR', symbol: '₹' },
        { code: 'USD', symbol: '$' },
        { code: 'EUR', symbol: '€' },
        { code: 'GBP', symbol: '£' },
        { code: 'JPY', symbol: '¥' }
    ];

    const WALLET_ICONS = [
        'wallet', 'credit-card', 'landmark', 'money', 'smartphone',
        'circle-dollar', 'coins', 'piggy-bank', 'building', 'briefcase',
        'shield', 'lock', 'award', 'ticket', 'pie-chart'
    ];

    useEffect(() => {
        loadAccounts();
    }, []);

    const loadAccounts = async () => {
        const data = await dbService.getAccounts();
        setAccounts(data);
    };

    const handleSave = async () => {
        if (!name.trim() || balance === '') return;

        try {
            const accData = {
                name: name.trim(),
                type,
                balance: parseFloat(balance),
                currency,
                icon: selectedIcon,
                include_in_total: includeInTotal ? 1 : 0
            };
            if (isEditing && editingId) {
                await dbService.updateAccount(editingId, accData);
            } else {
                await dbService.addAccount(accData);
            }
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => { });
            resetModal();
            loadAccounts();
        } catch (error) {
            console.error("Save account error:", error);
        }
    };

    const handleDelete = (id: number) => {
        setAlertConfig({
            visible: true,
            title: 'Delete Account?',
            message: 'Transactions linked to this account will remain but will no longer point to this account. Continue?',
            type: 'confirm',
            onConfirm: async () => {
                await dbService.deleteAccount(id);
                loadAccounts();
                setAlertConfig({ ...alertConfig, visible: false });
            }
        });
    };

    const resetModal = () => {
        setName('');
        setType('cash');
        setBalance('');
        setCurrency(defaultCurrency || 'INR');
        setSelectedIcon('wallet');
        setIncludeInTotal(true);
        setIsEditing(false);
        setEditingId(null);
        setShowModal(false);
    };

    const openEdit = (acc: any) => {
        setName(acc.name);
        setType(acc.type);
        setBalance(acc.balance.toString());
        setCurrency(acc.currency);
        setSelectedIcon(acc.icon);
        setIncludeInTotal(acc.include_in_total === undefined ? true : acc.include_in_total === 1);
        setIsEditing(true);
        setEditingId(acc.id);
        setShowModal(true);
    };

    const renderIconItem = ({ item }: { item: string }) => {
        const Icon = CATEGORY_ICONS[item] || CATEGORY_ICONS.tag;
        return (
            <SoundButton
                style={[
                    styles.iconPickerItem,
                    { backgroundColor: selectedIcon === item ? colors.primaryContainer : colors.card }
                ]}
                onPress={() => {
                    setSelectedIcon(item);
                    setShowIconPicker(false);
                }}
            >
                <Icon size={24} color={selectedIcon === item ? colors.primary : colors.onSurface} />
            </SoundButton>
        );
    };

    const getSymbol = (code: string) => {
        return CURRENCIES.find(c => c.code === code)?.symbol || '₹';
    };

    return (
        <Background>
            <View style={styles.header}>
                <SoundButton onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ChevronLeft color={colors.onSurface} size={28} />
                </SoundButton>
                <Text style={[styles.title, { color: colors.onSurface }]}>Financial Vaults</Text>
                <SoundButton onPress={() => setShowModal(true)} style={[styles.addBtn, { backgroundColor: colors.primary }]}>
                    <Plus color={colors.onPrimary} size={24} />
                </SoundButton>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.grid}>
                    {accounts.map((acc) => {
                        const Icon = CATEGORY_ICONS[acc.icon] || CATEGORY_ICONS.tag;
                        return (
                            <SoundButton
                                key={acc.id}
                                style={[styles.accCard, { backgroundColor: colors.card }]}
                                onLongPress={() => handleDelete(acc.id)}
                                onPress={() => openEdit(acc)}
                            >
                                <View style={[styles.iconBox, { backgroundColor: colors.primaryContainer }]}>
                                    <Icon size={24} color={colors.primary} />
                                </View>
                                <View style={styles.accInfo}>
                                    <Text style={[styles.accName, { color: colors.onSurface }]} numberOfLines={1}>{acc.name}</Text>
                                    <Text style={[styles.accType, { color: colors.onSurfaceVariant }]}>{acc.type.toUpperCase()}</Text>
                                </View>
                                <View style={styles.accBalance}>
                                    <Text style={[styles.balanceVal, { color: colors.primary }]}>
                                        {getSymbol(acc.currency)}{(acc.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </Text>
                                </View>
                                <View style={styles.cardActions}>
                                    <SoundButton onPress={() => openEdit(acc)} style={styles.actionIcon}>
                                        <Edit2 size={18} color={colors.onSurfaceVariant} />
                                    </SoundButton>
                                    <SoundButton onPress={() => handleDelete(acc.id)} style={styles.actionIcon}>
                                        <Trash2 size={18} color={isDark ? '#FFB4AB' : '#B3261E'} />
                                    </SoundButton>
                                </View>
                            </SoundButton>
                        );
                    })}
                </View>

                {accounts.length === 0 && (
                    <View style={styles.empty}>
                        <Wallet size={64} color={colors.outline} strokeWidth={1} />
                        <Text style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>No accounts configured yet</Text>
                    </View>
                )}
            </ScrollView>

            {/* Create/Edit Modal */}
            <Modal visible={showModal} animationType="slide" transparent>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                    <View style={styles.modalOverlay}>
                        <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
                            <View style={styles.modalHeader}>
                                <Text style={[styles.modalTitle, { color: colors.onSurface }]}>
                                    {isEditing ? 'Sync Vault' : 'New Vault'}
                                </Text>
                                <SoundButton onPress={resetModal}>
                                    <X color={colors.onSurface} size={24} />
                                </SoundButton>
                            </View>

                            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                                <View style={styles.inputSection}>
                                    <Text style={[styles.label, { color: colors.primary }]}>Vault Name</Text>
                                    <TextInput
                                        style={[styles.input, { color: colors.onSurface, borderBottomColor: colors.outline }]}
                                        value={name}
                                        onChangeText={setName}
                                        placeholder="e.g., My Wallet, Chase Bank"
                                        placeholderTextColor={colors.onSurfaceVariant}
                                    />
                                </View>

                                <View style={styles.inputSection}>
                                    <Text style={[styles.label, { color: colors.primary }]}>Initial Balance</Text>
                                    <View style={styles.balanceInputRow}>
                                        <Text style={[styles.currencyPrefix, { color: colors.onSurface }]}>{getSymbol(currency)}</Text>
                                        <TextInput
                                            style={[styles.input, { color: colors.onSurface, borderBottomColor: colors.outline, flex: 1 }]}
                                            value={balance}
                                            onChangeText={setBalance}
                                            keyboardType="decimal-pad"
                                            placeholder="0.00"
                                            placeholderTextColor={colors.onSurfaceVariant}
                                        />
                                    </View>
                                </View>

                                <View style={styles.inputSection}>
                                    <Text style={[styles.label, { color: colors.primary }]}>Vault Type</Text>
                                    <View style={styles.typeGrid}>
                                        {ACCOUNT_TYPES.map(t => (
                                            <SoundButton
                                                key={t.id}
                                                style={[
                                                    styles.typeBtn,
                                                    { backgroundColor: type === t.id ? colors.primary : colors.card }
                                                ]}
                                                onPress={() => setType(t.id)}
                                            >
                                                <t.icon size={18} color={type === t.id ? colors.onPrimary : colors.primary} />
                                                <Text style={[styles.typeBtnText, { color: type === t.id ? colors.onPrimary : colors.onSurface }]}>{t.label}</Text>
                                            </SoundButton>
                                        ))}
                                    </View>
                                </View>

                                <View style={styles.row}>
                                    <View style={[styles.inputSection, { flex: 1 }]}>
                                        <Text style={[styles.label, { color: colors.primary }]}>Currency</Text>
                                        <View style={styles.currencyGrid}>
                                            {CURRENCIES.map(c => (
                                                <SoundButton
                                                    key={c.code}
                                                    style={[
                                                        styles.currencyBtn,
                                                        { borderColor: currency === c.code ? colors.primary : colors.outline }
                                                    ]}
                                                    onPress={() => setCurrency(c.code)}
                                                >
                                                    <Text style={[styles.currencyCode, { color: currency === c.code ? colors.primary : colors.onSurface }]}>{c.code}</Text>
                                                </SoundButton>
                                            ))}
                                        </View>
                                    </View>

                                    <View style={[styles.inputSection, { flex: 0.4 }]}>
                                        <Text style={[styles.label, { color: colors.primary }]}>Icon</Text>
                                        <SoundButton
                                            style={[styles.iconTrigger, { backgroundColor: colors.card }]}
                                            onPress={() => setShowIconPicker(true)}
                                        >
                                            {React.createElement(CATEGORY_ICONS[selectedIcon] || CATEGORY_ICONS.tag, {
                                                size: 28,
                                                color: colors.primary
                                            })}
                                        </SoundButton>
                                    </View>
                                </View>

                                <View style={[styles.inputSection, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }]}>
                                    <View style={{ flex: 1, paddingRight: 16 }}>
                                        <Text style={[styles.label, { color: colors.primary, marginBottom: 4 }]}>Include in Total Balance</Text>
                                        <Text style={{ color: colors.onSurfaceVariant, fontSize: 13 }}>Toggle whether this vault's balance counts towards your global dashboard balance.</Text>
                                    </View>
                                    <View>
                                        <Switch
                                            value={includeInTotal}
                                            onValueChange={setIncludeInTotal}
                                            trackColor={{ false: colors.outline, true: colors.primary }}
                                            thumbColor={colors.surface}
                                        />
                                    </View>
                                </View>

                                <SoundButton
                                    style={[styles.saveBtn, { backgroundColor: colors.primary }]}
                                    onPress={handleSave}
                                >
                                    <Text style={[styles.saveBtnText, { color: colors.onPrimary }]}>
                                        {isEditing ? 'Update Records' : 'Initialize Vault'}
                                    </Text>
                                </SoundButton>
                            </ScrollView>
                        </View>
                    </View>
                </KeyboardAvoidingView>

                {/* Icon Picker Overlay */}
                <Modal visible={showIconPicker} animationType="fade" transparent>
                    <View style={styles.pickerOverlay}>
                        <View style={[styles.pickerCard, { backgroundColor: colors.surface }]}>
                            <View style={styles.pickerHeader}>
                                <Text style={[styles.modalTitle, { color: colors.onSurface }]}>Vault Icon</Text>
                                <SoundButton onPress={() => setShowIconPicker(false)}>
                                    <X color={colors.onSurface} size={24} />
                                </SoundButton>
                            </View>
                            <FlatList
                                data={WALLET_ICONS}
                                renderItem={renderIconItem}
                                keyExtractor={item => item}
                                numColumns={5}
                                contentContainerStyle={styles.pickerList}
                            />
                        </View>
                    </View>
                </Modal>
            </Modal>

            <ModalAlert
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
                onClose={() => setAlertConfig({ ...alertConfig, visible: false })}
                onConfirm={alertConfig.onConfirm}
            />
        </Background>
    );
};

const styles = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 },
    backBtn: { padding: 8 },
    title: { fontSize: 24, fontWeight: '400', letterSpacing: -0.5 },
    addBtn: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    content: { padding: 20 },
    grid: { gap: 12 },
    accCard: { padding: 16, borderRadius: 24, flexDirection: 'row', alignItems: 'center', position: 'relative', elevation: 2 },
    iconBox: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    accInfo: { flex: 1 },
    accName: { fontSize: 16, fontWeight: '600' },
    accType: { fontSize: 10, fontWeight: '700', marginTop: 2, letterSpacing: 0.5 },
    accBalance: { alignItems: 'flex-end' },
    balanceVal: { fontSize: 16, fontWeight: '700' },
    cardActions: { position: 'absolute', top: 12, right: 12, flexDirection: 'row', gap: 12, zIndex: 10 },
    actionIcon: { padding: 4, borderRadius: 12 },
    empty: { marginTop: 100, alignItems: 'center', gap: 16 },
    emptyText: { fontSize: 16, fontWeight: '500' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    modalCard: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, maxHeight: '90%', elevation: 12 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    modalTitle: { fontSize: 24, fontWeight: '400' },
    modalBody: { gap: 24 },
    inputSection: { marginBottom: 24, gap: 8 },
    label: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2 },
    input: { fontSize: 18, paddingVertical: 12, borderBottomWidth: 1.5 },
    balanceInputRow: { flexDirection: 'row', alignItems: 'baseline', gap: 12 },
    currencyPrefix: { fontSize: 24, fontWeight: '500' },
    typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    typeBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, gap: 8 },
    typeBtnText: { fontSize: 13, fontWeight: '500' },
    row: { flexDirection: 'row', gap: 16 },
    currencyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    currencyBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1.5 },
    currencyCode: { fontSize: 12, fontWeight: '700' },
    iconTrigger: { width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', alignSelf: 'flex-start' },
    saveBtn: { paddingVertical: 18, borderRadius: 20, alignItems: 'center', marginTop: 12, marginBottom: 40 },
    saveBtnText: { fontSize: 16, fontWeight: '600' },
    pickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
    pickerCard: { width: '90%', height: '70%', borderRadius: 28, padding: 24, elevation: 12 },
    pickerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    pickerList: { paddingBottom: 20 },
    iconPickerItem: { width: (width * 0.9 - 88) / 5, height: 60, borderRadius: 16, justifyContent: 'center', alignItems: 'center', margin: 4 }
});

export default ManageAccounts;
