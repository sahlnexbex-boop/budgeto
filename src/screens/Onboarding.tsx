import React, { useState } from 'react';
import { StyleSheet, View, Text, Dimensions, Image } from 'react-native';
import SoundButton from '../components/SoundButton';
import { useTheme } from '../theme/ThemeContext';
import Background from '../components/Background';
import { ArrowRight, Lock, Shield, Sparkles, DollarSign } from 'lucide-react-native';
import PasscodeScreen from './PasscodeScreen';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

const Onboarding = ({ onFinish, onSetPasscode }: { onFinish: () => void, onSetPasscode: (code: string) => void }) => {
    const { theme } = useTheme();
    const [step, setStep] = useState(0);
    const [settingPasscode, setSettingPasscode] = useState(false);
    const isDark = theme === 'dark';

    const steps = [
        {
            title: 'Welcome to Budgeto',
            desc: 'A modern, private way to track your finances. 100% offline and secure.',
            icon: require('../../assets/icon.png'),
            isImage: true
        },
        {
            title: 'Material You Design',
            desc: 'A clean, adaptive interface inspired by Google Pixel design language.',
            icon: Shield,
            isImage: false
        },
        {
            title: 'Secure by Default',
            desc: 'Your financial data is encrypted and never leaves your device.',
            icon: Lock,
            isImage: false
        }
    ];

    const next = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => { });
        if (step < steps.length - 1) {
            setStep(step + 1);
        } else {
            setSettingPasscode(true);
        }
    };

    if (settingPasscode) {
        return (
            <PasscodeScreen
                title="Create a Passcode"
                onComplete={(code) => {
                    onSetPasscode(code);
                    onFinish();
                }}
            />
        );
    }

    const currentStep = steps[step];
    const Icon = currentStep.icon;

    return (
        <View style={[styles.container, { backgroundColor: isDark ? '#141218' : '#FFFBFE' }]}>
            <View style={styles.bgAccents}>
                <View style={[styles.bgCircle, { top: -50, left: -50, backgroundColor: isDark ? '#381E7220' : '#EADDFF60' }]} />
                <View style={[styles.bgCircle, { bottom: -100, right: -100, backgroundColor: isDark ? '#381E7220' : '#EADDFF60' }]} />
            </View>

            <View style={styles.header}>
                <View style={[styles.iconBox, { backgroundColor: isDark ? '#4F378B' : '#EADDFF' }]}>
                    {currentStep.isImage ? (
                        <Image
                            source={Icon}
                            style={{ width: 80, height: 80, borderRadius: 20 }}
                        />
                    ) : (
                        <Icon color={isDark ? '#D0BCFF' : '#6750A4'} size={64} />
                    )}
                </View>
            </View>

            <View style={styles.textContainer}>
                <Text style={[styles.title, { color: isDark ? '#E6E1E5' : '#1C1B1F' }]}>{currentStep.title}</Text>
                <Text style={[styles.desc, { color: isDark ? '#CAC4D0' : '#49454F' }]}>{currentStep.desc}</Text>
            </View>

            <View style={styles.footer}>
                <View style={styles.dotContainer}>
                    {steps.map((_, i) => (
                        <View
                            key={i}
                            style={[
                                styles.dot,
                                {
                                    backgroundColor: step === i ? (isDark ? '#D0BCFF' : '#6750A4') : (isDark ? '#49454F' : '#E7E0EC'),
                                    width: step === i ? 24 : 8
                                }
                            ]}
                        />
                    ))}
                </View>

                <SoundButton
                    style={[styles.nextBtn, { backgroundColor: isDark ? '#D0BCFF' : '#6750A4' }]}
                    onPress={next}
                    activeOpacity={0.8}
                >
                    <Text style={[styles.nextText, { color: isDark ? '#381E72' : '#FFFFFF' }]}>
                        {step === steps.length - 1 ? 'Start Flow' : 'Next'}
                    </Text>
                    <ArrowRight color={isDark ? '#381E72' : '#FFFFFF'} size={24} />
                </SoundButton>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 40,
        justifyContent: 'space-between'
    },
    header: {
        alignItems: 'center',
        marginTop: 60,
    },
    iconBox: {
        width: 140,
        height: 140,
        borderRadius: 70,
        justifyContent: 'center',
        alignItems: 'center',
    },
    textContainer: {
        alignItems: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: '400',
        textAlign: 'center',
        marginBottom: 16,
        letterSpacing: -1
    },
    desc: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
    },
    footer: {
        marginBottom: 40,
        alignItems: 'center'
    },
    dotContainer: {
        flexDirection: 'row',
        marginBottom: 40,
        gap: 8
    },
    dot: {
        height: 8,
        borderRadius: 4,
    },
    nextBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 40,
        paddingVertical: 20,
        borderRadius: 40,
        width: '100%',
        justifyContent: 'center',
        gap: 12
    },
    nextText: {
        fontSize: 18,
        fontWeight: '500',
    },
    bgAccents: {
        ...StyleSheet.absoluteFillObject,
        overflow: 'hidden',
        zIndex: -1
    },
    bgCircle: {
        position: 'absolute',
        width: 300,
        height: 300,
        borderRadius: 150,
    }
});

export default Onboarding;