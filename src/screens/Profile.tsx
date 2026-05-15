import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TextInput, Platform, Image, Pressable, Keyboard, KeyboardAvoidingView } from 'react-native';
import SoundButton from '../components/SoundButton';
import { useTheme } from '../theme/ThemeContext';
import Background from '../components/Background';
import { Camera, Mail, Phone, MapPin, Edit2, LogOut, ChevronLeft, User, Shield, Bell, Check, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ModalAlert from '../components/ModalAlert';
import { dbService } from '../database/db';

// import * as ImagePicker from 'expo-image-picker';

const EditField = ({ icon: Icon, label, value, field, colors, onChange }: any) => (
    <View style={styles.editField}>
        <View style={[styles.itemIcon, { backgroundColor: colors.card }]}>
            <Icon size={20} color={colors.primary} />
        </View>
        <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: colors.primary }]}>{label}</Text>
            <TextInput
                style={[styles.input, { color: colors.onSurface, borderBottomColor: colors.outline }]}
                value={value}
                onChangeText={onChange}
            />
        </View>
    </View>
);

const ProfileItem = ({ icon: Icon, label, value, colors }: any) => (
    <View style={styles.item}>
        <View style={[styles.itemIcon, { backgroundColor: colors.card }]}>
            <Icon size={20} color={colors.primary} />
        </View>
        <View style={styles.itemContent}>
            <Text style={[styles.itemLabel, { color: colors.onSurfaceVariant }]}>{label}</Text>
            <Text style={[styles.itemValue, { color: colors.onSurface }]}>{value}</Text>
        </View>
    </View>
);

const Profile = ({ navigation }: any) => {
    const { theme, colors } = useTheme();

    const isDark = theme === 'dark';

    const [isEditing, setIsEditing] = useState(false);
    const [user, setUser] = useState({
        name: 'John Doe',
        email: 'john.doe@pixel.com',
        phone: '+1 234 567 890',
        location: 'Mountain View, CA',
        avatar: '', // Base64 or URI
    });

    const [tempUser, setTempUser] = useState({ ...user });
    const [stats, setStats] = useState({ categories: 0, transactions: 0 });
    const [alertConfig, setAlertConfig] = useState<{ visible: boolean; title: string; message: string; type: 'info' | 'error' | 'success' | 'confirm' }>({
        visible: false,
        title: '',
        message: '',
        type: 'info'
    });

    useEffect(() => {
        loadProfile();
        loadStats();
    }, []);

    const loadProfile = async () => {
        const saved = await AsyncStorage.getItem('user_profile');
        if (saved) {
            const data = JSON.parse(saved);
            setUser(data);
            setTempUser(data);
        }
    };

    const loadStats = async () => {
        const txs = await dbService.getTransactions();
        const cats = await dbService.getCategories();
        setStats({
            categories: cats ? cats.length : 0,
            transactions: txs ? txs.length : 0
        });
    };

    const handleSave = async () => {
        setUser(tempUser);
        await AsyncStorage.setItem('user_profile', JSON.stringify(tempUser));
        setIsEditing(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => { });
    };

    const handlePickImage = async () => {
        setAlertConfig({
            visible: true,
            title: 'Feature Unavailable',
            message: 'Image selection is disabled in this slim version to keep the app size small.',
            type: 'info'
        });
    };

    const handleLogout = async () => {
        if (Platform.OS === 'web') {
            window.location.reload();
        } else {
            // Reset to Login/Initial screen if routing allows, here we simulate reset
            navigation.replace('Dashboard'); // Or actual login screen
        }
    };



    return (
        <Background>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                    <View style={styles.header}>
                        <SoundButton onPress={() => navigation.goBack()} style={styles.backBtn}>
                            <ChevronLeft color={colors.onSurface} size={24} />
                        </SoundButton>
                        <Text style={[styles.title, { color: colors.onSurface }]}>
                            {isEditing ? 'System Identity' : 'My Core'}
                        </Text>
                        {isEditing ? (
                            <SoundButton onPress={handleSave}>
                                <Check color={colors.primary} size={24} />
                            </SoundButton>
                        ) : (
                            <SoundButton onPress={() => setIsEditing(true)}>
                                <Edit2 color={colors.onSurface} size={20} />
                            </SoundButton>
                        )}
                    </View>

                    <View style={styles.avatarSection}>
                        <SoundButton onPress={handlePickImage} style={styles.avatarWrapper}>
                            <View style={[styles.avatarContainer, { backgroundColor: colors.primaryContainer }]}>
                                {tempUser.avatar ? (
                                    <Image source={{ uri: isEditing ? tempUser.avatar : user.avatar }} style={styles.avatarImage} />
                                ) : (
                                    <Text style={[styles.avatarInitial, { color: colors.onPrimary }]}>
                                        {user.name.split(' ').map(n => n[0]).join('')}
                                    </Text>
                                )}
                            </View>
                            <View style={[styles.cameraBtn, { backgroundColor: colors.primary, borderColor: colors.background }]}>
                                <Camera size={16} color={colors.onPrimary} />
                            </View>
                        </SoundButton>
                        {!isEditing && (
                            <>
                                <Text style={[styles.userName, { color: colors.onSurface }]}>{user.name}</Text>
                                <Text style={[styles.userEmail, { color: colors.onSurfaceVariant }]}>{user.email}</Text>
                            </>
                        )}
                    </View>

                    {isEditing ? (
                        <View style={styles.editSection}>
                            <EditField
                                icon={User}
                                label="Identity Node"
                                value={tempUser.name}
                                field="name"
                                colors={colors}
                                onChange={(text: string) => setTempUser(prev => ({ ...prev, name: text }))}
                            />
                            <EditField
                                icon={Mail}
                                label="Comms Channel"
                                value={tempUser.email}
                                field="email"
                                colors={colors}
                                onChange={(text: string) => setTempUser(prev => ({ ...prev, email: text }))}
                            />
                            <EditField
                                icon={Phone}
                                label="Secure Line"
                                value={tempUser.phone}
                                field="phone"
                                colors={colors}
                                onChange={(text: string) => setTempUser(prev => ({ ...prev, phone: text }))}
                            />
                            <EditField
                                icon={MapPin}
                                label="Active Location"
                                value={tempUser.location}
                                field="location"
                                colors={colors}
                                onChange={(text: string) => setTempUser(prev => ({ ...prev, location: text }))}
                            />

                            <SoundButton
                                style={[styles.cancelBtn, { borderColor: colors.outline }]}
                                onPress={() => { setIsEditing(false); setTempUser(user); }}
                            >
                                <Text style={{ color: colors.onSurface, fontWeight: 'bold' }}>Abort Changes</Text>
                            </SoundButton>
                        </View>
                    ) : (
                        <>
                            <View style={[styles.statsCard, { backgroundColor: colors.card }]}>
                                <View style={styles.statBox}>
                                    <Text style={[styles.statValue, { color: colors.primary }]}>{stats.categories}</Text>
                                    <Text style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>Nodes</Text>
                                </View>
                                <View style={[styles.statDivider, { backgroundColor: colors.outline }]} />
                                <View style={styles.statBox}>
                                    <Text style={[styles.statValue, { color: colors.primary }]}>{stats.transactions}</Text>
                                    <Text style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>Flows</Text>
                                </View>
                            </View>

                            <View style={styles.section}>
                                <Text style={[styles.sectionTitle, { color: colors.primary }]}>Node Integrity</Text>
                                <ProfileItem icon={Phone} label="Secure" value={user.phone} colors={colors} />
                                <ProfileItem icon={MapPin} label="Zone" value={user.location} colors={colors} />
                            </View>
                        </>
                    )}

                    <SoundButton
                        style={[styles.logoutBtn, { borderColor: isDark ? '#F2B8B5' : '#B3261E' }]}
                        onPress={handleLogout}
                    >
                        <LogOut color={isDark ? '#F2B8B5' : '#B3261E'} size={20} />
                        <Text style={[styles.logoutText, { color: isDark ? '#F2B8B5' : '#B3261E' }]}>Disconnect</Text>
                    </SoundButton>
                </ScrollView>
            </KeyboardAvoidingView>

            <ModalAlert
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
                onClose={() => setAlertConfig({ ...alertConfig, visible: false })}
            />
        </Background>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { paddingBottom: 60 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, paddingTop: 60 },
    title: { fontSize: 24, fontWeight: '400', letterSpacing: -0.5 },
    backBtn: { padding: 4 },
    avatarSection: { alignItems: 'center', marginTop: 20, marginBottom: 32 },
    avatarWrapper: { position: 'relative', width: 120, height: 120 },
    avatarContainer: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    avatarInitial: { fontSize: 40, fontWeight: 'bold' },
    avatarImage: { width: 120, height: 120, borderRadius: 60 },
    cameraBtn: { position: 'absolute', bottom: 0, right: 0, width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', elevation: 4, borderWidth: 3 },
    userName: { fontSize: 24, fontWeight: '600', marginTop: 16 },
    userEmail: { fontSize: 14, marginTop: 4 },
    statsCard: { marginHorizontal: 24, padding: 20, borderRadius: 28, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', marginBottom: 32 },
    statBox: { alignItems: 'center' },
    statValue: { fontSize: 20, fontWeight: '700' },
    statLabel: { fontSize: 12, marginTop: 4 },
    statDivider: { width: 1, height: 30 },
    section: { marginBottom: 32, paddingHorizontal: 24 },
    editSection: { paddingHorizontal: 24, gap: 24 },
    sectionTitle: { fontSize: 13, fontWeight: '700', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1.5 },
    item: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, marginBottom: 8 },
    editField: { flexDirection: 'row', alignItems: 'center' },
    itemIcon: { width: 44, height: 44, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    itemContent: { flex: 1 },
    itemLabel: { fontSize: 12, fontWeight: '500' },
    itemValue: { fontSize: 15, fontWeight: '400', marginTop: 2 },
    inputContainer: { flex: 1 },
    inputLabel: { fontSize: 12, fontWeight: '700', marginBottom: 4 },
    input: { fontSize: 16, paddingVertical: 8, borderBottomWidth: 1 },
    cancelBtn: { marginTop: 12, padding: 16, borderRadius: 16, borderWidth: 1, alignItems: 'center' },
    logoutBtn: { marginHorizontal: 24, padding: 18, borderRadius: 20, borderWidth: 1.5, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 10 },
    logoutText: { fontSize: 16, fontWeight: '600' }
});

export default Profile;
