import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { StyleSheet, View, Platform } from 'react-native';
import SoundButton from '../components/SoundButton';
import { Home, List, PieChart, Settings, Calendar as CalIcon, Landmark } from 'lucide-react-native';
import Dashboard from '../screens/Dashboard';
import AddTransaction from '../screens/AddTransaction';
import Transactions from '../screens/Transactions';
import Reports from '../screens/Reports';
import SettingsScreen from '../screens/Settings';
import PasscodeScreen from '../screens/PasscodeScreen';
import Profile from '../screens/Profile';
import CalendarScreen from '../screens/CalendarScreen';
import DebtScreen from '../screens/DebtScreen';
import { useTheme } from '../theme/ThemeContext';
import ReminderSettings from '../screens/ReminderSettings';
import ManageCategories from '../screens/ManageCategories';
import SecurityCenter from '../screens/SecurityCenter';
import AboutBudgeto from '../screens/AboutBudgeto';
import DeveloperSupport from '../screens/DeveloperSupport';
import ManageAccounts from '../screens/ManageAccounts';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import * as Notifications from 'expo-notifications';
import { useNavigation } from '@react-navigation/native';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TabNavigator = () => {
    const { theme, colors } = useTheme();
    const isDark = theme === 'dark';

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: colors.card,
                    borderTopColor: colors.outline,
                    height: 80,
                    paddingBottom: 20,
                    paddingTop: 10,
                },
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.onSurfaceVariant,
            }}
        >
            <Tab.Screen
                name="HomeTab"
                component={Dashboard}
                options={{
                    tabBarLabel: 'Home',
                    tabBarIcon: ({ color }) => <Home color={color} size={24} />,
                }}
            />
            <Tab.Screen
                name="TransactionsTab"
                component={Transactions}
                options={{
                    tabBarLabel: 'All Flows',
                    tabBarIcon: ({ color }) => <List color={color} size={24} />,
                }}
            />
            <Tab.Screen
                name="DebtTab"
                component={DebtScreen}
                options={{
                    tabBarLabel: 'Debts',
                    tabBarIcon: ({ color }) => <Landmark color={color} size={24} />,
                }}
            />
            <Tab.Screen
                name="ReportsTab"
                component={Reports}
                options={{
                    tabBarLabel: 'Reports',
                    tabBarIcon: ({ color }) => <PieChart color={color} size={24} />,
                }}
            />
            <Tab.Screen
                name="SettingsTab"
                component={SettingsScreen}
                options={{
                    tabBarLabel: 'Settings',
                    tabBarIcon: ({ color }) => <Settings color={color} size={24} />,
                }}
            />
        </Tab.Navigator>
    );
};

const ChangePasscodeWrapper = ({ navigation, ...props }: any) => {
    return (
        <PasscodeScreen
            {...props}
            navigation={navigation}
            title="New Passcode"
            onComplete={async (code: string) => {
                await AsyncStorage.setItem('user_passcode', code);
                navigation.goBack();
            }}
        />
    );
};

const MainNavigator = () => {
    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                <Stack.Screen name="MainTabs" component={TabNavigator} />
                <Stack.Screen
                    name="AddTransaction"
                    component={AddTransaction}
                    options={{ presentation: 'modal', animation: 'slide_from_left' }}
                />
                <Stack.Screen
                    name="Profile"
                    component={Profile}
                    options={{ animation: 'slide_from_right' }}
                />
                <Stack.Screen
                    name="ChangePasscode"
                    component={ChangePasscodeWrapper}
                    options={{ presentation: 'fullScreenModal', animation: 'slide_from_left' }}
                />
                <Stack.Screen
                    name="Calendar"
                    component={CalendarScreen}
                    options={{ animation: 'slide_from_right' }}
                />
                <Stack.Screen
                    name="Debt"
                    component={DebtScreen}
                    options={{ animation: 'slide_from_right' }}
                />
                <Stack.Screen
                    name="Reminders"
                    component={ReminderSettings}
                    options={{ animation: 'slide_from_right' }}
                />
                <Stack.Screen
                    name="ManageCategories"
                    component={ManageCategories}
                    options={{ animation: 'slide_from_right' }}
                />
                <Stack.Screen
                    name="ManageAccounts"
                    component={ManageAccounts}
                    options={{ animation: 'slide_from_right' }}
                />
                <Stack.Screen
                    name="SecurityCenter"
                    component={SecurityCenter}
                    options={{ animation: 'slide_from_right' }}
                />
                <Stack.Screen
                    name="AboutBudgeto"
                    component={AboutBudgeto}
                    options={{ animation: 'slide_from_bottom' }}
                />
                <Stack.Screen
                    name="DeveloperSupport"
                    component={DeveloperSupport}
                    options={{ animation: 'slide_from_bottom' }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 }
});

export default MainNavigator;
