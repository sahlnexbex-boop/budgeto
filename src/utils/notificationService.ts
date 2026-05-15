import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Dummy Notification Service
 * Native notification libraries removed to minimize app size.
 */
export const notificationService = {
    requestPermissions: async () => {
        return false;
    },

    scheduleDailyReminder: async (hour: number, minute: number, body?: string) => {
        // Feature disabled for slim version
        await AsyncStorage.setItem('reminder_time', JSON.stringify({ hour, minute }));
        await AsyncStorage.setItem('reminder_body', body || "");
        await AsyncStorage.setItem('reminder_enabled', 'false');
        return 'disabled';
    },

    disableReminder: async () => {
        await AsyncStorage.setItem('reminder_enabled', 'false');
    },

    getSettings: async () => {
        const enabled = await AsyncStorage.getItem('reminder_enabled');
        const timeStr = await AsyncStorage.getItem('reminder_time');
        const body = await AsyncStorage.getItem('reminder_body');
        const time = timeStr ? JSON.parse(timeStr) : { hour: 20, minute: 0 };

        return {
            enabled: false, // Always false in slim version
            hour: time.hour,
            minute: time.minute,
            body: body || "Reminders are disabled in this version."
        };
    },

    sendTestNotification: async () => {
        // No-op
    }
};
