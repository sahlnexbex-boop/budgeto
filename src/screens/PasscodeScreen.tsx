import React, { useState } from 'react';
import { StyleSheet, View, Text, Dimensions, Modal } from 'react-native';
import SoundButton from '../components/SoundButton';
import { useTheme } from '../theme/ThemeContext';
import Background from '../components/Background';
import { Lock, Delete, XCircle, ChevronLeft, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

const PasscodeScreen = ({ onComplete, navigation, title = "Enter Passcode" }: { onComplete: (code: string) => void, navigation?: any, title?: string }) => {
    const { theme } = useTheme();
    const [code, setCode] = useState('');
    const [errorModal, setErrorModal] = useState(false);
    const isDark = theme === 'dark';

    const handlePress = (num: string) => {
        if (code.length < 4) {
            const newCode = code + num;
            setCode(newCode);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            if (newCode.length === 4) {
                setTimeout(() => {
                    onComplete(newCode);
                    // We don't clear code here immediately because we might need to show a shake or error
                }, 100);
            }
        }
    };

    const handleDelete = () => {
        setCode(code.slice(0, -1));
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    };

    // Public method to reset code from parent if needed
    React.useEffect(() => {
        if (code.length === 4) {
            // Small delay to allow parent to process
            const timer = setTimeout(() => setCode(''), 1000);
            return () => clearTimeout(timer);
        }
    }, [code]);

    return (
        <Background>
            <View style={styles.container}>
                {navigation && (
                    <SoundButton
                        style={styles.backBtn}
                        onPress={() => navigation.goBack()}
                    >
                        <ChevronLeft color={isDark ? '#E6E1E5' : '#1C1B1F'} size={28} />
                    </SoundButton>
                )}
                <View style={styles.header}>
                    <View style={[styles.iconBox, { backgroundColor: isDark ? '#4F378B' : '#EADDFF' }]}>
                        <Lock color={isDark ? '#D0BCFF' : '#6750A4'} size={32} />
                    </View>
                    <Text style={[styles.title, { color: isDark ? '#E6E1E5' : '#1C1B1F' }]}>{title}</Text>
                </View>

                <View style={styles.dotsContainer}>
                    {[1, 2, 3, 4].map((i) => (
                        <View
                            key={i}
                            style={[
                                styles.dot,
                                {
                                    backgroundColor: code.length >= i
                                        ? (isDark ? '#D0BCFF' : '#6750A4')
                                        : (isDark ? '#49454F' : '#E7E0EC'),
                                    transform: [{ scale: code.length >= i ? 1.2 : 1 }]
                                }
                            ]}
                        />
                    ))}
                </View>

                <View style={styles.keypad}>
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((key, i) => (
                        <SoundButton
                            key={i}
                            style={styles.key}
                            onPress={() => {
                                if (key === '⌫') {
                                    if (code === '') {
                                        if (navigation) navigation.goBack();
                                    } else {
                                        handleDelete();
                                    }
                                }
                                else if (key !== '') handlePress(key);
                            }}
                            activeOpacity={0.7}
                            disabled={key === ''}
                        >
                            <View style={[styles.keyInner, { backgroundColor: isDark ? '#1D1B20' : '#F7F2FA' }]}>
                                {key === '⌫' ? (
                                    code === '' ? (
                                        <Text style={[styles.cancelText, { color: isDark ? '#E6E1E5' : '#1C1B1F' }]}>Cancel</Text>
                                    ) : (
                                        <Delete color={isDark ? '#E6E1E5' : '#1C1B1F'} size={24} />
                                    )
                                ) : (
                                    <Text style={[styles.keyText, { color: isDark ? '#E6E1E5' : '#1C1B1F' }]}>{key}</Text>
                                )}
                            </View>
                        </SoundButton>
                    ))}
                </View>
            </View>
        </Background>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backBtn: {
        position: 'absolute',
        top: 60,
        left: 24,
        zIndex: 10,
        padding: 8,
    },
    header: {
        alignItems: 'center',
        marginBottom: 48,
    },
    iconBox: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 22,
        fontWeight: '500',
        letterSpacing: -0.5,
    },
    dotsContainer: {
        flexDirection: 'row',
        marginBottom: 64,
        gap: 20
    },
    dot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    keypad: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        width: width * 0.85,
        justifyContent: 'center',
    },
    key: {
        width: '33.3%',
        height: 90,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 8,
    },
    keyInner: {
        width: 74,
        height: 74,
        borderRadius: 37, // Full Round
        justifyContent: 'center',
        alignItems: 'center',
    },
    keyText: {
        fontSize: 28,
        fontWeight: '400',
    },
    cancelText: {
        fontSize: 14,
        fontWeight: '500',
    }
});

export default PasscodeScreen;
