import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TextInput, Modal, FlatList, Dimensions, KeyboardAvoidingView, Platform } from 'react-native';
import SoundButton from '../components/SoundButton';
import { useTheme } from '../theme/ThemeContext';
import Background from '../components/Background';
import { ChevronLeft, Plus, Trash2, Edit2, Check, X, Palette } from 'lucide-react-native';
import { CATEGORY_ICONS } from '../utils/iconLibrary';
import { dbService } from '../database/db';
import * as Haptics from 'expo-haptics';
import ModalAlert from '../components/ModalAlert';

const { width } = Dimensions.get('window');

const ManageCategories = ({ navigation }: any) => {
    const { colors, theme, currency } = useTheme();
    const isDark = theme === 'dark';

    const currencySymbols: { [key: string]: string } = {
        'INR': '₹', 'USD': '$', 'EUR': '€', 'GBP': '£', 'JPY': '¥'
    };
    const symbol = currencySymbols[currency] || '₹';

    const [categories, setCategories] = useState<any[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    const [name, setName] = useState('');
    const [budget, setBudget] = useState('');
    const [selectedIcon, setSelectedIcon] = useState('tag');
    const [showIconPicker, setShowIconPicker] = useState(false);

    const [alertConfig, setAlertConfig] = useState<{ visible: boolean; title: string; message: string; type: any; onConfirm?: () => void }>({
        visible: false,
        title: '',
        message: '',
        type: 'info'
    });



    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        const cats = await dbService.getCategories();
        setCategories(cats);
    };

    const handleSave = async () => {
        if (!name.trim()) return;

        try {
            const catData = { name, icon: selectedIcon, color: colors.primary, budget: parseFloat(budget) || 0 };
            if (isEditing && editingId) {
                await dbService.updateCategory(editingId, catData);
            } else {
                await dbService.addCategory(catData);
            }
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => { });
            resetModal();
            loadCategories();
        } catch (error) {
            console.error("Save category error:", error);
        }
    };

    const handleDelete = (id: number) => {
        setAlertConfig({
            visible: true,
            title: 'Delete Category?',
            message: 'All transactions with this category will remain, but the category itself will be removed from future selection.',
            type: 'confirm',
            onConfirm: async () => {
                await dbService.deleteCategory(id);
                loadCategories();
                setAlertConfig({ ...alertConfig, visible: false });
            }
        });
    };

    const resetModal = () => {
        setName('');
        setBudget('');
        setSelectedIcon('tag');
        setIsEditing(false);
        setEditingId(null);
        setShowModal(false);
    };

    const openEdit = (cat: any) => {
        setName(cat.name);
        setBudget(cat.budget?.toString() || '');
        setSelectedIcon(cat.icon);
        setIsEditing(true);
        setEditingId(cat.id);
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

    return (
        <Background>
            <View style={styles.header}>
                <SoundButton onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ChevronLeft color={colors.onSurface} size={28} />
                </SoundButton>
                <Text style={[styles.title, { color: colors.onSurface }]}>Categories</Text>
                <SoundButton onPress={() => setShowModal(true)} style={[styles.addBtn, { backgroundColor: colors.primary }]}>
                    <Plus color={colors.onPrimary} size={24} />
                </SoundButton>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.grid}>
                    {categories.map((cat) => {
                        const Icon = CATEGORY_ICONS[cat.icon] || CATEGORY_ICONS.tag;
                        return (
                            <SoundButton
                                key={cat.id}
                                style={[styles.catCard, { backgroundColor: colors.card }]}
                                onLongPress={() => handleDelete(cat.id)}
                                onPress={() => openEdit(cat)}
                            >
                                <View style={[styles.iconBox, { backgroundColor: colors.primaryContainer }]}>
                                    <Icon size={24} color={colors.primary} />
                                </View>
                                <Text style={[styles.catName, { color: colors.onSurface }]} numberOfLines={1}>{cat.name}</Text>
                                <View style={styles.cardActions}>
                                    <SoundButton onPress={() => openEdit(cat)} style={styles.actionIcon}>
                                        <Edit2 size={16} color={colors.onSurfaceVariant} />
                                    </SoundButton>
                                    <SoundButton onPress={() => handleDelete(cat.id)} style={styles.actionIcon}>
                                        <Trash2 size={16} color={isDark ? '#FFB4AB' : '#B3261E'} />
                                    </SoundButton>
                                </View>
                            </SoundButton>
                        );
                    })}
                </View>
            </ScrollView>

            {/* Create/Edit Modal */}
            <Modal visible={showModal} animationType="slide" transparent>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 25}
                >
                    <View style={styles.modalOverlay}>
                        <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
                            <View style={styles.modalHeader}>
                                <Text style={[styles.modalTitle, { color: colors.onSurface }]}>
                                    {isEditing ? 'Update Identity' : 'New Category'}
                                </Text>
                                <SoundButton onPress={resetModal}>
                                    <X color={colors.onSurface} size={24} />
                                </SoundButton>
                            </View>

                            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                                <View style={styles.inputSection}>
                                    <Text style={[styles.label, { color: colors.primary }]}>Category Name</Text>
                                    <TextInput
                                        style={[styles.input, { color: colors.onSurface, borderBottomColor: colors.outline }]}
                                        value={name}
                                        onChangeText={setName}
                                        placeholder="Enter name..."
                                        placeholderTextColor={colors.onSurfaceVariant}
                                    />
                                </View>

                                <View style={styles.inputSection}>
                                    <Text style={[styles.label, { color: colors.primary }]}>Monthly Budget ({symbol})</Text>
                                    <TextInput
                                        style={[styles.input, { color: colors.onSurface, borderBottomColor: colors.outline }]}
                                        value={budget}
                                        onChangeText={setBudget}
                                        placeholder="0.00"
                                        placeholderTextColor={colors.onSurfaceVariant}
                                        keyboardType="decimal-pad"
                                    />
                                    <Text style={{ fontSize: 11, color: colors.onSurfaceVariant, marginTop: 4, opacity: 0.7 }}>
                                        Set a spending limit for this category
                                    </Text>
                                </View>

                                <View style={styles.selectorRow}>
                                    <View style={styles.selectorItem}>
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

                                <SoundButton
                                    style={[styles.saveBtn, { backgroundColor: colors.primary }]}
                                    onPress={handleSave}
                                >
                                    <Text style={[styles.saveBtnText, { color: colors.onPrimary }]}>
                                        {isEditing ? 'Synchronize' : 'Initialize'}
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
                                <Text style={[styles.modalTitle, { color: colors.onSurface }]}>Select Source Icon</Text>
                                <SoundButton onPress={() => setShowIconPicker(false)}>
                                    <X color={colors.onSurface} size={24} />
                                </SoundButton>
                            </View>
                            <FlatList
                                data={Object.keys(CATEGORY_ICONS)}
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
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    catCard: { width: (width - 52) / 2, padding: 16, borderRadius: 24, alignItems: 'center', position: 'relative' },
    iconBox: { width: 56, height: 56, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    catName: { fontSize: 16, fontWeight: '500' },
    cardActions: { position: 'absolute', top: 12, right: 12, flexDirection: 'row', gap: 12, zIndex: 10 },
    actionIcon: { padding: 4, borderRadius: 12 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    modalCard: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '85%', elevation: 12 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    modalTitle: { fontSize: 24, fontWeight: '400' },
    modalBody: { gap: 24 },
    inputSection: { gap: 8 },
    label: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
    input: { fontSize: 18, paddingVertical: 12, borderBottomWidth: 1 },
    selectorRow: { flexDirection: 'row', gap: 24 },
    selectorItem: { flex: 1, gap: 12 },
    iconTrigger: { width: 64, height: 64, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    saveBtn: { paddingVertical: 18, borderRadius: 20, alignItems: 'center', marginTop: 12 },
    saveBtnText: { fontSize: 16, fontWeight: '500' },
    pickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
    pickerCard: { width: '90%', height: '70%', borderRadius: 28, padding: 24, elevation: 12 },
    pickerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    pickerList: { paddingBottom: 20 },
    iconPickerItem: { width: (width * 0.9 - 88) / 5, height: 60, borderRadius: 16, justifyContent: 'center', alignItems: 'center', margin: 4 }
});

export default ManageCategories;
