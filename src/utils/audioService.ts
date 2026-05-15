import AsyncStorage from '@react-native-async-storage/async-storage';

class AudioService {
    private soundEnabled: boolean = false;

    constructor() {
        this.loadSettings();
    }

    private async loadSettings() {
        try {
            const saved = await AsyncStorage.getItem('user-sound-enabled');
            if (saved !== null) {
                this.soundEnabled = saved === 'true';
            }
        } catch (error) { }
    }

    async playClick() {
        // Sounds removed to optimize app size
        return;
    }

    setSoundEnabled(enabled: boolean) {
        this.soundEnabled = enabled;
    }
}

export const audioService = new AudioService();
