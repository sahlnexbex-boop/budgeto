import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TextInput, Modal, FlatList, Pressable, Keyboard, KeyboardAvoidingView, Platform } from 'react-native';
import SoundButton from '../components/SoundButton';
import { useTheme } from '../theme/ThemeContext';
import Background from '../components/Background';
import { ChevronLeft, Plus, Trash2, Check, User, DollarSign, Calendar, TrendingUp, TrendingDown, Clock } from 'lucide-react-native';
import { dbService } from '../database/db';
import * as Haptics from 'expo-haptics';
import { format } from 'date-fns';
import ModalAlert from '../components/ModalAlert';
// import * as Contacts from 'expo-contacts';
import { Contact as ContactIcon } from 'lucide-react-native';

const DebtScreen = ({ navigation }: any) => {
    const { theme, currency } = useTheme();
    const isDark = theme === 'dark';
    const [debts, setDebts] = useState<any[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newDebt, setNewDebt] = useState({
        person: '',
        amount: '',
        type: 'owed_to_me', // 'owed_to_me' (positive) or 'i_owe' (negative)
        note: ''
    });

    const [alertConfig, setAlertConfig] = useState<{ visible: boolean; title: string; message: string; type: any; onConfirm?: () => void }>({
        visible: false,
        title: '',
        message: '',
        type: 'info'
    });

    const currencySymbols: { [key: string]: string } = {
        'INR': '₹', 'USD': '$', 'EUR': '€', 'GBP': '£', 'JPY': '¥'
    };
    const symbol = currencySymbols[currency] || '₹';

    useEffect(() => {
        loadDebts();
    }, []);

    const loadDebts = async () => {
        const data = await dbService.getDebts();
        setDebts(data);
    };

    const handleAddDebt = async () => {
        if (!newDebt.person || !newDebt.amount) return;

        await dbService.addDebt({
            ...newDebt,
            amount: parseFloat(newDebt.amount),
            date: new Date().toISOString(),
            status: 'pending'
        });

        setNewDebt({ person: '', amount: '', type: 'owed_to_me', note: '' });
        setShowAddModal(false);
        loadDebts();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => { });
    };

    const toggleStatus = async (id: number, currentStatus: string) => {
        const newStatus = currentStatus === 'pending' ? 'settled' : 'pending';
        await dbService.updateDebtStatus(id, newStatus);
        loadDebts();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
    };

    const pickContact = async () => {
        setAlertConfig({
            visible: true,
            title: 'Feature Unavailable',
            message: 'Contact selection is disabled in this slim version to keep the app size small.',
            type: 'info'
        });
    };

    const confirmDelete = (id: number) => {
        setAlertConfig({
            visible: true,
            title: 'Delete Entry?',
            message: 'This will permanently remove this debt record.',
            type: 'confirm',
            onConfirm: async () => {
                await dbService.deleteDebt(id);
                setAlertConfig({ ...alertConfig, visible: false });
                loadDebts();
            }
        });
    };

    const totalOwedToMe = debts.filter(d => d.type === 'owed_to_me' && d.status === 'pending').reduce((acc, d) => acc + d.amount, 0);
    const totalIOwe = debts.filter(d => d.type === 'i_owe' && d.status === 'pending').reduce((acc, d) => acc + d.amount, 0);

    const renderItem = ({ item, index }: { item: any, index: number }) => (
        <View style={[styles.debtCard, { backgroundColor: isDark ? '#1D1B20' : '#F7F2FA' }, item.status === 'settled' && { opacity: 0.6 }]}>
            <View style={[styles.statusIndicator, { backgroundColor: item.type === 'owed_to_me' ? '#146C2E' : '#B3261E' }]} />
            <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                    <Text style={[styles.personName, { color: isDark ? '#E6E1E5' : '#1C1B1F' }]}>{item.person}</Text>
                    <Text style={[styles.amountText, { color: item.type === 'owed_to_me' ? '#146C2E' : '#B3261E' }]}>
                        {item.type === 'owed_to_me' ? '+' : '-'}{symbol}{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Text>
                </View>
                <Text style={[styles.noteText, { color: isDark ? '#CAC4D0' : '#49454F' }]}>{item.note || 'No description'}</Text>
                <View style={styles.cardFooter}>
                    <View style={styles.dateBox}>
                        <Clock size={12} color={isDark ? '#CAC4D0' : '#49454F'} />
                        <Text style={[styles.dateText, { color: isDark ? '#CAC4D0' : '#49454F' }]}>{format(new Date(item.date), 'MMM dd, yyyy')}</Text>
                    </View>
                    <View style={styles.actions}>
                        <SoundButton onPress={() => toggleStatus(item.id, item.status)} style={[styles.actionBtn, { backgroundColor: item.status === 'settled' ? '#146C2E' : (isDark ? '#2B2930' : '#EADDFF') }]}>
                            <Check size={16} color={item.status === 'settled' ? '#FFFFFF' : (isDark ? '#D0BCFF' : '#6750A4')} />
                        </SoundButton>
                        <SoundButton onPress={() => confirmDelete(item.id)} style={[styles.actionBtn, { backgroundColor: isDark ? '#311110' : '#F9DEDC' }]}>
                            <Trash2 size={16} color={isDark ? '#F2B8B5' : '#B3261E'} />
                        </SoundButton>
                    </View>
                </View>
            </View>
        </View>
    );

    return (
        <Background>
            <View style={styles.container}>
                <View style={styles.header}>
                    <SoundButton onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <ChevronLeft color={isDark ? '#E6E1E5' : '#1C1B1F'} size={24} />
                    </SoundButton>
                    <Text style={[styles.title, { color: isDark ? '#E6E1E5' : '#1C1B1F' }]}>Debt Center</Text>
                    <SoundButton onPress={() => setShowAddModal(true)} style={[styles.addBtn, { backgroundColor: isDark ? '#D0BCFF' : '#6750A4' }]}>
                        <Plus color={isDark ? '#381E72' : '#FFFFFF'} size={24} />
                    </SoundButton>
                </View>

                <View style={styles.statsRow}>
                    <View style={[styles.statCard, { backgroundColor: isDark ? '#1D1B20' : '#E6F4EA' }]}>
                        <TrendingUp size={20} color="#146C2E" />
                        <Text style={[styles.statLabel, { color: isDark ? '#CAC4D0' : '#146C2E' }]}>Owed to me</Text>
                        <Text style={[styles.statValue, { color: '#146C2E' }]}>{symbol}{totalOwedToMe.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: isDark ? '#1D1B20' : '#FCE8E6' }]}>
                        <TrendingDown size={20} color="#B3261E" />
                        <Text style={[styles.statLabel, { color: isDark ? '#CAC4D0' : '#B3261E' }]}>I owe</Text>
                        <Text style={[styles.statValue, { color: '#B3261E' }]}>{symbol}{totalIOwe.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                    </View>
                </View>

                <FlatList
                    data={debts}
                    renderItem={renderItem}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <User color={isDark ? '#49454F' : '#CAC4D0'} size={64} strokeWidth={1} />
                            <Text style={[styles.emptyText, { color: isDark ? '#CAC4D0' : '#49454F' }]}>No debt balance recorded</Text>
                        </View>
                    }
                />

                <Modal visible={showAddModal} transparent animationType="slide">
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={{ flex: 1 }}
                    >
                        <View style={styles.modalOverlay}>
                            <View style={[styles.modalCard, { backgroundColor: isDark ? '#2B2930' : '#FFFFFF' }]}>
                                <Text style={[styles.modalTitle, { color: isDark ? '#E6E1E5' : '#1C1B1F' }]}>Record Debt</Text>
                                <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

                                    <View style={styles.typeToggle}>
                                        <SoundButton
                                            style={[styles.toggleBtn, newDebt.type === 'owed_to_me' && { backgroundColor: '#146C2E' }]}
                                            onPress={() => setNewDebt({ ...newDebt, type: 'owed_to_me' })}
                                        >
                                            <Text style={[styles.toggleText, { color: newDebt.type === 'owed_to_me' ? '#FFFFFF' : '#146C2E' }]}>Owed to me</Text>
                                        </SoundButton>
                                        <SoundButton
                                            style={[styles.toggleBtn, newDebt.type === 'i_owe' && { backgroundColor: '#B3261E' }]}
                                            onPress={() => setNewDebt({ ...newDebt, type: 'i_owe' })}
                                        >
                                            <Text style={[styles.toggleText, { color: newDebt.type === 'i_owe' ? '#FFFFFF' : '#B3261E' }]}>I owe</Text>
                                        </SoundButton>
                                    </View>

                                    <View style={styles.inputGroup}>
                                        <User size={20} color={isDark ? '#D0BCFF' : '#6750A4'} />
                                        <TextInput
                                            style={[styles.input, { color: isDark ? '#E6E1E5' : '#1C1B1F' }]}
                                            placeholder="Person / Entity"
                                            placeholderTextColor={isDark ? '#938F99' : '#79747E'}
                                            value={newDebt.person}
                                            onChangeText={text => setNewDebt({ ...newDebt, person: text })}
                                        />
                                        <SoundButton
                                            onPress={pickContact}
                                            style={[styles.contactPickerBtn, { backgroundColor: isDark ? '#49454F' : '#E7E0EC' }]}
                                        >
                                            <ContactIcon size={18} color={isDark ? '#D0BCFF' : '#6750A4'} />
                                        </SoundButton>
                                    </View>

                                    <View style={styles.inputGroup}>
                                        <Text style={{ fontSize: 20, color: isDark ? '#D0BCFF' : '#6750A4', fontWeight: 'bold' }}>{symbol}</Text>
                                        <TextInput
                                            style={[styles.input, { color: isDark ? '#E6E1E5' : '#1C1B1F' }]}
                                            placeholder="Amount"
                                            placeholderTextColor={isDark ? '#938F99' : '#79747E'}
                                            keyboardType="decimal-pad"
                                            value={newDebt.amount}
                                            onChangeText={text => setNewDebt({ ...newDebt, amount: text })}
                                        />
                                    </View>

                                    <View style={[styles.inputGroup, { alignItems: 'flex-start' }]}>
                                        <Clock size={20} color={isDark ? '#D0BCFF' : '#6750A4'} style={{ marginTop: 12 }} />
                                        <TextInput
                                            style={[styles.input, { color: isDark ? '#E6E1E5' : '#1C1B1F', textAlignVertical: 'top' }]}
                                            placeholder="Note / Reason"
                                            placeholderTextColor={isDark ? '#938F99' : '#79747E'}
                                            multiline
                                            numberOfLines={3}
                                            value={newDebt.note}
                                            onChangeText={text => setNewDebt({ ...newDebt, note: text })}
                                        />
                                    </View>
                                    <View style={styles.modalActions}>
                                        <SoundButton onPress={() => setShowAddModal(false)} style={styles.cancelBtn}>
                                            <Text style={{ color: isDark ? '#E6E1E5' : '#1C1B1F', fontWeight: 'bold' }}>Cancel</Text>
                                        </SoundButton>
                                        <SoundButton onPress={handleAddDebt} style={[styles.confirmBtn, { backgroundColor: isDark ? '#D0BCFF' : '#6750A4' }]}>
                                            <Text style={{ color: isDark ? '#381E72' : '#FFFFFF', fontWeight: 'bold' }}>Save Record</Text>
                                        </SoundButton>
                                    </View>
                                    <View style={{ height: 40 }} />
                                </ScrollView>
                            </View>
                        </View>
                    </KeyboardAvoidingView>
                </Modal>

                <ModalAlert
                    visible={alertConfig.visible}
                    title={alertConfig.title}
                    message={alertConfig.message}
                    type={alertConfig.type}
                    onClose={() => setAlertConfig({ ...alertConfig, visible: false })}
                    onConfirm={alertConfig.onConfirm}
                />
            </View >
        </Background >
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, paddingTop: 60 },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 24, gap: 16 },
    backBtn: { padding: 4 },
    title: { fontSize: 24, fontWeight: '400', flex: 1 },
    addBtn: { width: 50, height: 50, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    statsRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, marginBottom: 24 },
    statCard: { flex: 1, padding: 16, borderRadius: 24 },
    statLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 },
    statValue: { fontSize: 20, fontWeight: '700' },
    list: { paddingHorizontal: 20, paddingBottom: 100 },
    debtCard: { flexDirection: 'row', borderRadius: 24, marginBottom: 16, overflow: 'hidden' },
    statusIndicator: { width: 6 },
    cardContent: { flex: 1, padding: 20 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    personName: { fontSize: 18, fontWeight: '600' },
    amountText: { fontSize: 18, fontWeight: '700' },
    noteText: { fontSize: 14, marginBottom: 12 },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    dateBox: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    dateText: { fontSize: 12 },
    actions: { flexDirection: 'row', gap: 8 },
    actionBtn: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    empty: { marginTop: 100, alignItems: 'center', gap: 16 },
    emptyText: { fontSize: 16, fontWeight: '500' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    modalCard: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, elevation: 12, maxHeight: '85%' },
    modalTitle: { fontSize: 24, fontWeight: '400', marginBottom: 32 },
    typeToggle: { flexDirection: 'row', gap: 12, marginBottom: 24 },
    toggleBtn: { flex: 1, paddingVertical: 12, borderRadius: 20, borderWidth: 1.5, borderColor: 'transparent', alignItems: 'center' },
    toggleText: { fontWeight: '700', fontSize: 13 },
    inputGroup: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 16, paddingHorizontal: 16, marginVertical: 8 },
    input: { flex: 1, paddingVertical: 14, fontSize: 16 },
    contactPickerBtn: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
    modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 16, marginTop: 32 },
    cancelBtn: { padding: 16 },
    confirmBtn: { paddingHorizontal: 32, paddingVertical: 16, borderRadius: 16 }
});

export default DebtScreen;