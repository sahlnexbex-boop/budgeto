import React from 'react';
import { StyleSheet, View, Text, Modal, Dimensions } from 'react-native';
import SoundButton from './SoundButton';
import { useTheme } from '../theme/ThemeContext';
import { AlertCircle, CheckCircle2, Info, HelpCircle } from 'lucide-react-native';

interface ModalAlertProps {
    visible: boolean;
    title: string;
    message: string;
    onClose: () => void;
    onConfirm?: () => void;
    type?: 'info' | 'error' | 'success' | 'confirm';
    confirmText?: string;
    cancelText?: string;
}

const { width } = Dimensions.get('window');

const ModalAlert = ({
    visible,
    title,
    message,
    onClose,
    onConfirm,
    type = 'info',
    confirmText = 'OK',
    cancelText = 'Cancel'
}: ModalAlertProps) => {
    const { theme, colors } = useTheme();
    const isDark = theme === 'dark';

    const getIcon = () => {
        switch (type) {
            case 'error': return <AlertCircle color={colors.error || '#B3261E'} size={24} />;
            case 'success': return <CheckCircle2 color="#146C2E" size={24} />;
            case 'confirm': return <HelpCircle color={colors.primary} size={24} />;
            default: return <Info color={colors.primary} size={24} />;
        }
    };

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.overlay}>
                <View style={[styles.card, { backgroundColor: colors.surfaceContainer || (isDark ? '#2B2930' : '#ECE6F0') }]}>
                    <View style={styles.iconContainer}>{getIcon()}</View>
                    <Text style={[styles.title, { color: colors.onSurface }]}>{title}</Text>
                    <Text style={[styles.message, { color: colors.onSurfaceVariant }]}>{message}</Text>

                    <View style={styles.actions}>
                        {type === 'confirm' && (
                            <SoundButton
                                style={[styles.btn, { backgroundColor: 'transparent' }]}
                                onPress={onClose}
                            >
                                <Text style={[styles.btnText, { color: colors.primary }]}>{cancelText}</Text>
                            </SoundButton>
                        )}
                        <SoundButton
                            style={[
                                styles.btn,
                                { backgroundColor: type === 'error' ? colors.error || '#B3261E' : colors.primary },
                                { paddingHorizontal: 24 }
                            ]}
                            onPress={onConfirm || onClose}
                        >
                            <Text style={[styles.btnText, { color: type === 'error' ? '#FFFFFF' : colors.onPrimary }]}>
                                {confirmText}
                            </Text>
                        </SoundButton>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
    card: { width: width * 0.85, maxWidth: 400, padding: 24, borderRadius: 28, elevation: 12 },
    iconContainer: { marginBottom: 16, alignItems: 'center' },
    title: { fontSize: 24, fontWeight: '400', marginBottom: 16, textAlign: 'center' },
    message: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
    actions: { flexDirection: 'row', gap: 8, justifyContent: 'flex-end', width: '100%' },
    btn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    btnText: { fontSize: 14, fontWeight: '500' }
});

export default ModalAlert;
