import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Dimensions, Platform, Modal, Switch, Image, Pressable } from 'react-native';
import SoundButton from '../components/SoundButton';
import { LineChart } from 'react-native-gifted-charts';
import { useTheme } from '../theme/ThemeContext';
import { ColorPresets } from '../theme/colors';
import { Wallet, TrendingUp, TrendingDown, Plus, Menu, X, Landmark as DebtIcon, Landmark, PieChart as PieIcon, Shield, Info, Target, ReceiptText, History, User, Calendar as CalIcon, Sparkles, DollarSign, Palette, Settings2, Settings, ChevronDown } from 'lucide-react-native';
import { dbService } from '../database/db';
import { CATEGORY_ICONS } from '../utils/iconLibrary';
import { format, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfYear, endOfYear, isWithinInterval } from 'date-fns';
import GlassCard from '../components/GlassCard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ModalAlert from '../components/ModalAlert';

const { width } = Dimensions.get('window');

const AnimatedValue = ({ value, symbol, style, adjustSize = false }: { value: number, symbol: string, style: any, adjustSize?: boolean }) => {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        let startValue = displayValue;
        const duration = 600;
        const frames = 60;
        const frameTime = duration / frames;
        let frame = 0;

        const timer = setInterval(() => {
            frame++;
            const progress = frame / frames;
            const easeOutExpo = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
            const current = startValue + (value - startValue) * easeOutExpo;

            setDisplayValue(current);
            if (frame === frames) clearInterval(timer);
        }, frameTime);

        return () => clearInterval(timer);
    }, [value]);

    // Auto-scale font size for very large numbers
    const getScaledStyle = () => {
        const flattened = StyleSheet.flatten(style);
        if (!adjustSize) return flattened;
        const length = (symbol + displayValue.toLocaleString()).length;
        let fontSize = flattened.fontSize || 42;
        if (length > 15) fontSize = 28;
        else if (length > 12) fontSize = 32;
        else if (length > 10) fontSize = 36;
        return { ...flattened, fontSize };
    };

    return <Text style={getScaledStyle()} numberOfLines={1} adjustsFontSizeToFit>{symbol}{displayValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>;
};

const Dashboard = ({ navigation }: any) => {
    const { theme, colors, currency } = useTheme();
    const [balance, setBalance] = useState(0);
    const [income, setIncome] = useState(0);
    const [expense, setExpense] = useState(0);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [allTransactions, setAllTransactions] = useState<any[]>([]);
    const [selectedRange, setSelectedRange] = useState<'today' | 'week' | 'month' | 'year' | 'total'>('total');
    const [showRangeDropdown, setShowRangeDropdown] = useState(false);
    const [chartData, setChartData] = useState<any[]>([]);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [alertConfig, setAlertConfig] = useState({
        visible: false, title: '', message: '', type: 'info' as any
    });
    const [budgetHealth, setBudgetHealth] = useState<any[]>([]);
    const [showTour, setShowTour] = useState(false);
    const [tourStep, setTourStep] = useState(0);
    const [showWidgetEditor, setShowWidgetEditor] = useState(false);
    const [widgets, setWidgets] = useState({
        balance: true,
        shortcuts: true,
        analytics: true,
        recent: true,
        health: true
    });

    const WIDGET_META = {
        balance: { title: 'Net Asset Vault', icon: Wallet, desc: 'Shows your total balance and cash flow overview.' },
        shortcuts: { title: 'Quick Action Hub', icon: Target, desc: 'Instant access to add debt or check insights.' },
        analytics: { title: 'Expense Analytics', icon: TrendingUp, desc: 'Visualize your spending patterns over time.' },
        recent: { title: 'Transaction Stream', icon: History, desc: 'A live feed of your most recent transactions.' },
        health: { title: 'Budget Health Pulse', icon: Shield, desc: 'Monitor how much budget is left in your categories.' }
    };

    const currencySymbols: { [key: string]: string } = {
        'INR': '₹', 'USD': '$', 'EUR': '€', 'GBP': '£', 'JPY': '¥'
    };
    const symbol = currencySymbols[currency] || '₹';

    const rangeOptions = [
        { label: 'Today', value: 'today' },
        { label: 'This Week', value: 'week' },
        { label: 'This Month', value: 'month' },
        { label: 'This Year', value: 'year' },
        { label: 'Total', value: 'total' }
    ] as const;

    const getRangeBounds = (range: typeof selectedRange) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const endToday = new Date(today);
        endToday.setHours(23, 59, 59, 999);
        
        switch (range) {
            case 'today':
                return { start: today, end: endToday };
            case 'week':
                return { start: startOfWeek(today), end: endOfWeek(today) };
            case 'month':
                return { start: startOfMonth(today), end: endOfMonth(today) };
            case 'year':
                return { start: startOfYear(today), end: endOfYear(today) };
            default:
                return null;
        }
    };

    const filteredTransactions = useMemo(() => {
        const includedAccountIds = accounts.filter((a: any) => a.include_in_total === undefined || a.include_in_total === 1).map((a: any) => a.id);
        const accountFiltered = allTransactions.filter((t: any) => !t.account_id || includedAccountIds.includes(t.account_id));
        if (selectedRange === 'total') return accountFiltered;
        const bounds = getRangeBounds(selectedRange);
        if (!bounds) return [];
        return accountFiltered.filter((t: any) => {
            if (!t.date) return false;
            const txDate = new Date(t.date);
            txDate.setHours(0, 0, 0, 0);
            return isWithinInterval(txDate, bounds);
        });
    }, [allTransactions, accounts, selectedRange]);

    const displayIncome = selectedRange === 'total'
        ? income
        : filteredTransactions.reduce((sum: number, t: any) => sum + (t.type === 'income' ? t.amount || 0 : 0), 0);
    const displayExpense = selectedRange === 'total'
        ? expense
        : filteredTransactions.reduce((sum: number, t: any) => sum + (t.type === 'expense' ? t.amount || 0 : 0), 0);
    const displayBalance = selectedRange === 'total' ? balance : displayIncome - displayExpense;

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', loadData);
        loadData();
        checkTourAndWidgets();
        return unsubscribe;
    }, [navigation]);

    const checkTourAndWidgets = async () => {
        try {
            const done = await AsyncStorage.getItem('app_tour_done_v1');
            if (done !== 'true') {
                setShowTour(true);
            }
            const wg = await AsyncStorage.getItem('dashboard_widgets_v1');
            if (wg) {
                setWidgets(JSON.parse(wg));
            }
        } catch (e) {
            console.log(e);
        }
    };

    const handleNextTourStep = async () => {
        if (tourStep < 3) {
            setTourStep(tourStep + 1);
        } else {
            setShowTour(false);
            try {
                await AsyncStorage.setItem('app_tour_done_v1', 'true');
            } catch (e) { }
        }
    };

    const toggleWidget = async (key: keyof typeof widgets) => {
        const newW = { ...widgets, [key]: !widgets[key] };
        setWidgets(newW);
        try {
            await AsyncStorage.setItem('dashboard_widgets_v1', JSON.stringify(newW));
        } catch (e) { }
    };

    const loadData = async () => {
        try {
            const txs = await dbService.getTransactions();
            setAllTransactions(txs || []);
            setTransactions(txs.slice(0, 5) || []);

            const accs = await dbService.getAccounts();
            setAccounts(accs || []);

            const includedAccountIds = (accs || []).filter((a: any) => a.include_in_total === undefined || a.include_in_total === 1).map((a: any) => a.id);

            let totalIn = 0;
            let totalOut = 0;
            let currentBalance = 0;

            if (accs && accs.length > 0) {
                accs.forEach((a: any) => {
                    if (a.include_in_total === undefined || a.include_in_total === 1) {
                        currentBalance += a.balance || 0;
                    }
                });
            }

            txs.forEach((t: any) => {
                if (t.account_id && !includedAccountIds.includes(t.account_id)) {
                    return; // Skip transaction stats if account is omitted
                }

                const amt = t.amount || 0;
                if (t.type === 'income') totalIn += amt;
                else totalOut += amt;
            });

            setIncome(totalIn);
            setExpense(totalOut);

            // if accounts exist, use exact sum, otherwise use txs derived balance
            setBalance(accs.length > 0 ? currentBalance : totalIn - totalOut);

            const dailyData: { [key: string]: number } = {};
            for (let i = 6; i >= 0; i--) {
                const dateStr = format(subDays(new Date(), i), 'yyyy-MM-dd');
                dailyData[dateStr] = 0;
            }

            txs.forEach((t: any) => {
                if (!t.date) return;
                const dateStr = format(new Date(t.date), 'yyyy-MM-dd');
                if (dailyData[dateStr] !== undefined && t.type === 'expense') {
                    dailyData[dateStr] += t.amount || 0;
                }
            });

            const formattedChart = Object.keys(dailyData).map(date => ({
                value: dailyData[date],
                label: format(new Date(date), 'dd'),
                dataPointText: dailyData[date] > 0 ? (dailyData[date] > 999 ? `${(dailyData[date] / 1000).toFixed(1)}k` : `${Math.round(dailyData[date])}`) : '',
            }));

            if (formattedChart.length === 0) {
                setChartData([{ value: 0, label: '' }, { value: 0, label: '' }]);
            } else {
                setChartData(formattedChart);
            }

            const profileStr = await AsyncStorage.getItem('user_profile');
            if (profileStr) {
                try {
                    setUser(JSON.parse(profileStr));
                } catch (pe) {
                    console.error("Profile parse error", pe);
                }
            }

            const cats = await dbService.getCategories();
            const monthlySpent: { [key: number]: number } = {};
            const now = new Date();
            const mStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

            const monthTxs = await dbService.getTransactions();
            monthTxs.forEach((t: any) => {
                if (t.date >= mStart && t.type === 'expense') {
                    monthlySpent[t.category_id] = (monthlySpent[t.category_id] || 0) + t.amount;
                }
            });

            const health = cats.filter((c: any) => c.budget > 0).map((c: any) => ({
                id: c.id,
                name: c.name,
                budget: c.budget,
                spent: monthlySpent[c.id] || 0,
                color: c.color
            }));
            setBudgetHealth(health);
        } catch (error) {
            console.error("Dashboard loadData error:", error);
        }
    };

    const isDark = theme === 'dark';

    const MenuItem = ({ icon: Icon, label, route, tab, alertText }: any) => (
        <SoundButton
            style={styles.menuItem}
            onPress={() => {
                setIsMenuOpen(false);
                if (tab) navigation.navigate(tab);
                else if (route) navigation.navigate(route);
                else if (alertText) setAlertConfig({
                    visible: true,
                    title: label,
                    message: alertText,
                    type: 'info'
                });
            }}
        >
            <View style={[styles.menuIconContainer, { backgroundColor: colors.card }]}>
                <Icon color={colors.primary} size={22} />
            </View>
            <Text style={[styles.menuText, { color: colors.onSurface }]}>{label}</Text>
        </SoundButton>
    );

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <SoundButton onPress={() => setIsMenuOpen(true)} style={styles.menuTrigger}>
                        <Menu color={colors.onSurface} size={28} />
                    </SoundButton>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Image
                            source={require('../../assets/icon.png')}
                            style={{ width: 28, height: 28, marginRight: 10, borderRadius: 6 }}
                        />
                        <Text style={[styles.userName, { color: colors.onSurface }]}>Budgeto Hub</Text>
                    </View>
                    <SoundButton
                        style={styles.profileBox}
                        onPress={() => navigation.navigate('Profile')}
                    >
                        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                            {user?.avatar ? (
                                <Image source={{ uri: user.avatar }} style={{ width: 44, height: 44 }} />
                            ) : (
                                <Text style={{ color: colors.onPrimary, fontWeight: 'bold' }}>
                                    {user?.name ? user.name.split(' ').map((n: string) => n[0]).join('') : 'JD'}
                                </Text>
                            )}
                        </View>
                    </SoundButton>
                </View>

                {/* Balance Card */}
                {widgets.balance && (
                    <View style={[styles.assetCard, { backgroundColor: colors.primary, zIndex: showRangeDropdown ? 20 : 1 }] }>
                        {/* Background Clipping Container */}
                        <View style={[StyleSheet.absoluteFill, { borderRadius: 36, overflow: 'hidden' }]}>
                            <View style={styles.accentMoney}>
                                <DollarSign size={80} color="rgba(255,255,255,0.05)" style={{ transform: [{ rotate: '15deg' }] }} />
                            </View>
                        </View>

                        <View style={{ padding: 32 }}>
                            <View style={styles.cardHeader}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <Text style={[styles.cardTag, { color: 'rgba(255,255,255,0.7)' }]}>NET LIQUIDITY</Text>
                                <Sparkles size={14} color="rgba(255,255,255,0.8)" />
                            </View>
                            <Wallet color="#FFFFFF" size={20} />
                        </View>
                        <View style={styles.rangeFilterContainer}>
                            <SoundButton
                                onPress={() => setShowRangeDropdown(!showRangeDropdown)}
                                style={[styles.rangeFilterButton, { borderColor: 'rgba(255,255,255,0.3)' }]}
                            >
                                <Text style={styles.rangeFilterText}>
                                    {rangeOptions.find(r => r.value === selectedRange)?.label || 'Total'}
                                </Text>
                                <ChevronDown size={14} color="rgba(255,255,255,0.7)" />
                            </SoundButton>
                            {showRangeDropdown && (
                                <>
                                    <Pressable 
                                        style={{ 
                                            position: 'absolute', 
                                            top: -Dimensions.get('window').height, 
                                            left: -Dimensions.get('window').width, 
                                            width: Dimensions.get('window').width * 2, 
                                            height: Dimensions.get('window').height * 2,
                                            zIndex: 1001 
                                        }} 
                                        onPress={() => setShowRangeDropdown(false)} 
                                    />
                                    <View style={[styles.rangeDropdown, { backgroundColor: isDark ? '#2A282D' : '#FFFFFF', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', zIndex: 1002 }]}>

                                    {rangeOptions.map((option) => (
                                        <SoundButton
                                            key={option.value}
                                            onPress={() => {
                                                setSelectedRange(option.value);
                                                setShowRangeDropdown(false);
                                            }}
                                            style={[
                                                styles.rangeDropdownItem,
                                                selectedRange === option.value && { backgroundColor: colors.primary + '20' }
                                            ]}
                                        >
                                            <Text style={[
                                                styles.rangeDropdownText, 
                                                { color: isDark ? '#E6E1E5' : '#1C1B1F' },
                                                selectedRange === option.value && { color: colors.primary, fontWeight: '700' }
                                            ]}>
                                                {option.label}
                                            </Text>
                                    </SoundButton>
                                ))}
                                </View>
                                </>
                            )}
                        </View>
                        <AnimatedValue
                            value={displayBalance}
                            symbol={symbol}
                            style={[styles.balanceText, { color: '#FFFFFF' }]}
                            adjustSize={true}
                        />
                        <View style={styles.statsStrip}>
                            <View style={[styles.statPill, { backgroundColor: 'rgba(255,255,255,0.95)' }]}>
                                <TrendingUp size={14} color="#146C2E" />
                                <AnimatedValue
                                    value={displayIncome}
                                    symbol={"+" + symbol}
                                    style={[styles.statValue, { color: '#146C2E' }]}
                                />
                            </View>
                            <View style={[styles.statPill, { backgroundColor: 'rgba(255,255,255,0.95)' }]}>
                                <TrendingDown size={14} color="#B3261E" />
                                <AnimatedValue
                                    value={displayExpense}
                                    symbol={"-" + symbol}
                                    style={[styles.statValue, { color: '#B3261E' }]}
                                />
                            </View>
                        </View>
                        </View>
                    </View>
                )}

                {/* Accounts Reel removed following user request */}

                {/* Quick Actions */}
                {widgets.shortcuts && (
                    <View style={styles.shortcuts}>
                        <SoundButton style={styles.shortcutItem} onPress={() => navigation.navigate('AddTransaction')}>
                            <View style={[styles.shortcutIcon, { backgroundColor: colors.primaryContainer }]}>
                                <Plus color={colors.primary} size={24} />
                            </View>
                            <Text style={[styles.shortcutLabel, { color: colors.onSurface }]}>Flow</Text>
                        </SoundButton>

                        <SoundButton style={styles.shortcutItem} onPress={() => navigation.navigate('Calendar')}>
                            <View style={[styles.shortcutIcon, { backgroundColor: colors.card }]}>
                                <CalIcon color={colors.primary} size={24} />
                            </View>
                            <Text style={[styles.shortcutLabel, { color: colors.onSurface }]}>Calendar</Text>
                        </SoundButton>

                        <SoundButton style={styles.shortcutItem} onPress={() => navigation.navigate('DebtTab')}>
                            <View style={[styles.shortcutIcon, { backgroundColor: colors.card }]}>
                                <DebtIcon color={colors.primary} size={24} />
                            </View>
                            <Text style={[styles.shortcutLabel, { color: colors.onSurface }]}>Debt</Text>
                        </SoundButton>

                        <SoundButton style={styles.shortcutItem} onPress={() => navigation.navigate('ReportsTab')}>
                            <View style={[styles.shortcutIcon, { backgroundColor: colors.card }]}>
                                <PieIcon color={colors.primary} size={24} />
                            </View>
                            <Text style={[styles.shortcutLabel, { color: colors.onSurface }]}>Report</Text>
                        </SoundButton>
                    </View>
                )}

                {/* Analytics Snapshot */}
                {widgets.analytics && (
                    <>
                        <View style={styles.sectionHeader}>
                            <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Expense Analytics</Text>
                            <View style={[styles.timeChip, { backgroundColor: colors.card }]}>
                                <Text style={[styles.timeText, { color: colors.primary }]}>WEEK</Text>
                            </View>
                        </View>

                        <View>
                            <GlassCard style={styles.chartWrapper} cornerRadius={32}>
                                <LineChart
                                    data={chartData}
                                    height={160}
                                    width={width - 80}
                                    spacing={44}
                                    initialSpacing={24}
                                    color={colors.primary}
                                    thickness={4}
                                    hideRules
                                    hideYAxisText
                                    yAxisThickness={0}
                                    xAxisThickness={0}
                                    showValuesAsDataPointsText={true}
                                    textColor={colors.onSurfaceVariant}
                                    textShiftY={-12}
                                    textShiftX={-4}
                                    dataPointsColor={colors.primary}
                                    dataPointsRadius={4}
                                    xAxisLabelTextStyle={{ color: colors.outline, fontSize: 10 }}
                                />
                            </GlassCard>
                        </View>
                    </>
                )}

                {/* Recent Activity */}
                {widgets.recent && (
                    <>
                        <View style={styles.recentHeader}>
                            <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Recent Streams</Text>
                            <SoundButton onPress={() => navigation.navigate('TransactionsTab')}>
                                <Text style={{ color: colors.primary, fontWeight: 'bold' }}>See All</Text>
                            </SoundButton>
                        </View>

                        <View style={styles.recentFlows}>
                            {transactions.map((t, i) => {
                                const IconComp = CATEGORY_ICONS[t.icon] || CATEGORY_ICONS.tag || Target;
                                return (
                                    <View key={i}>
                                        <GlassCard style={styles.txCard} cornerRadius={20}>
                                            <View style={styles.txInner}>
                                                <View style={[styles.txIconBox, { backgroundColor: colors.primaryContainer }]}>
                                                    <IconComp color={colors.primary} size={20} />
                                                </View>
                                                <View style={styles.txInfo}>
                                                    <Text style={[styles.txTitle, { color: colors.onSurface }]}>{t.category_name}</Text>
                                                    <Text style={[styles.txDate, { color: colors.onSurfaceVariant }]}>{format(new Date(t.date), 'MMM dd')}</Text>
                                                </View>
                                                <Text style={[styles.txValue, { color: t.type === 'income' ? '#146C2E' : '#B3261E' }]}>
                                                    {t.type === 'income' ? '+' : '-'}{symbol}{(t.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </Text>
                                            </View>
                                        </GlassCard>
                                    </View>
                                );
                            })}
                        </View>
                    </>
                )}

                {/* Budget Health (Advanced Option) */}
                {widgets.health && budgetHealth.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Budget Health ({format(new Date(), 'MMMM')})</Text>
                            <SoundButton onPress={() => navigation.navigate('ManageCategories')}>
                                <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '700' }}>MANAGE</Text>
                            </SoundButton>
                        </View>
                        <View style={styles.budgetGrid}>
                            {budgetHealth.map((b) => {
                                const percent = Math.min((b.spent / b.budget) * 100, 100);
                                const isOver = b.spent > b.budget;
                                return (
                                    <View key={b.id} style={[styles.budgetCard, { backgroundColor: colors.card }]}>
                                        <View style={styles.budgetHeader}>
                                            <Text style={[styles.budgetName, { color: colors.onSurface }]}>{b.name}</Text>
                                            <Text style={[styles.budgetDetail, { color: isOver ? '#B3261E' : colors.onSurfaceVariant }]}>
                                                {symbol}{Math.round(b.spent)} / {symbol}{Math.round(b.budget)}
                                            </Text>
                                        </View>
                                        <View style={[styles.budgetProgressBg, { backgroundColor: colors.outline + '20' }]}>
                                            <View style={[styles.budgetProgressBar, { width: `${percent}%`, backgroundColor: isOver ? '#B3261E' : b.color }]} />
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                )}

                <SoundButton
                    style={[styles.customizeBtn, { borderColor: colors.outline }]}
                    onPress={() => setShowWidgetEditor(true)}
                >
                    <Settings2 size={18} color={colors.onSurfaceVariant} />
                    <Text style={{ color: colors.onSurfaceVariant, fontSize: 14, fontWeight: '600' }}>Customize Dashboard</Text>
                </SoundButton>

                <View style={{ height: 40 }} />
            </ScrollView>

            <SoundButton
                style={[styles.mainFab, { backgroundColor: colors.primary }]}
                onPress={() => navigation.navigate('AddTransaction')}
            >
                <Plus color={colors.onPrimary} size={32} />
            </SoundButton>

            <Modal visible={isMenuOpen} transparent onRequestClose={() => setIsMenuOpen(false)}>
                <View style={styles.modalBackdrop}>
                    <View
                        style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.6)' }]}
                    />
                    <View
                        style={[styles.sidebar, { backgroundColor: colors.background }]}
                    >
                        <View style={styles.sidebarHeader}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Image
                                    source={require('../../assets/icon.png')}
                                    style={{ width: 32, height: 32, marginRight: 12, borderRadius: 8 }}
                                />
                                <Text style={[styles.brand, { color: colors.onSurface }]}>Budgeto</Text>
                            </View>
                            <SoundButton onPress={() => setIsMenuOpen(false)}>
                                <X color={colors.onSurface} size={28} />
                            </SoundButton>
                        </View>

                        <View style={styles.sidebarMenu}>
                            <MenuItem icon={User} label="My Profile" route="Profile" />
                            <MenuItem icon={CalIcon} label="Calendar View" route="Calendar" />
                            <MenuItem icon={DebtIcon} label="Debt Center" tab="DebtTab" />
                            <MenuItem icon={PieIcon} label="Visual Reports" tab="ReportsTab" />
                            <MenuItem icon={ReceiptText} label="All Flows" tab="TransactionsTab" />
                            <MenuItem icon={Landmark} label="Financial Vaults" route="ManageAccounts" />
                            <MenuItem icon={Palette} label="Category Hub" route="ManageCategories" />
                            <MenuItem icon={Shield} label="Security Center" route="SecurityCenter" />
                        </View>

                        <View style={styles.sidebarFooter} />
                    </View>
                    <SoundButton
                        style={{ flex: 1 }}
                        activeOpacity={1}
                        onPress={() => setIsMenuOpen(false)}
                    />
                </View>
            </Modal>

            <ModalAlert
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
                onClose={() => setAlertConfig({ ...alertConfig, visible: false })}
            />

            <Modal visible={showWidgetEditor} transparent animationType="slide" onRequestClose={() => setShowWidgetEditor(false)}>
                <View style={[styles.bottomDrawerBackdrop, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
                    <View style={[styles.modalCard, { backgroundColor: colors.surface, paddingBottom: 40, width: '100%' }]}>
                        <View style={styles.modalHeaderRow}>
                            <View>
                                <Text style={[styles.modalTitle, { color: colors.onSurface }]}>Dashboard Grid</Text>
                                <Text style={{ color: colors.onSurfaceVariant, fontSize: 13 }}>Personalize your financial overview</Text>
                            </View>
                            <SoundButton onPress={() => setShowWidgetEditor(false)} style={{ backgroundColor: colors.outline + '20', padding: 8, borderRadius: 20 }}>
                                <X color={colors.onSurface} size={20} />
                            </SoundButton>
                        </View>
                        <ScrollView style={{ marginTop: 10 }} showsVerticalScrollIndicator={false}>
                            <View style={{ gap: 12 }}>
                                {Object.keys(widgets).map((key) => {
                                    const meta = WIDGET_META[key as keyof typeof widgets];
                                    const active = widgets[key as keyof typeof widgets];
                                    return (
                                        <SoundButton
                                            key={key}
                                            onPress={() => toggleWidget(key as keyof typeof widgets)}
                                            style={[
                                                styles.widgetCard,
                                                {
                                                    backgroundColor: active ? colors.primaryContainer : colors.card,
                                                    borderColor: active ? colors.primary : colors.outline + '40'
                                                }
                                            ]}
                                        >
                                            <View style={[styles.widgetIconBox, { backgroundColor: active ? colors.primary : colors.outline + '20' }]}>
                                                <meta.icon size={20} color={active ? colors.onPrimary : colors.onSurfaceVariant} />
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={[styles.widgetTitle, { color: colors.onSurface }]}>{meta.title}</Text>
                                                <Text style={[styles.widgetDesc, { color: colors.onSurfaceVariant }]}>{meta.desc}</Text>
                                            </View>
                                            <Switch
                                                value={active}
                                                onValueChange={() => toggleWidget(key as keyof typeof widgets)}
                                                trackColor={{ false: colors.outline, true: colors.primary }}
                                                thumbColor={Platform.OS === 'ios' ? undefined : colors.surface}
                                            />
                                        </SoundButton>
                                    );
                                })}
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            <Modal visible={showTour} transparent animationType="fade">
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 24, zIndex: 10000 }}>
                    <View style={{ backgroundColor: colors.surface, padding: 30, borderRadius: 28, width: '100%', maxWidth: 400, alignItems: 'center', elevation: 12 }}>
                        <Info color={colors.primary} size={48} style={{ marginBottom: 20 }} />
                        <Text style={{ fontSize: 26, fontWeight: 'bold', color: colors.onSurface, marginBottom: 12, textAlign: 'center' }}>
                            {tourStep === 0 ? "Welcome to Budgeto!" : tourStep === 1 ? "Quick Actions" : tourStep === 2 ? "Analytics & Health" : "You're all set!"}
                        </Text>
                        <Text style={{ fontSize: 16, color: colors.onSurfaceVariant, textAlign: 'center', marginBottom: 32, lineHeight: 24 }}>
                            {tourStep === 0 && "Your personalized financial command center. Tap the top-left menu to access settings, connect backups, and configure your app."}
                            {tourStep === 1 && "Use the Quick Action buttons or the + FAB below to instantly record debts, expenses, and check reports."}
                            {tourStep === 2 && "Scroll down to see your Expense Analytics and Budget Health. Keep track of everything at a glance."}
                            {tourStep === 3 && "You can also fully customize your Dashboard! Toggle widgets on or off using the Customize Dashboard button at the bottom."}
                        </Text>
                        <SoundButton
                            style={{ backgroundColor: colors.primary, paddingVertical: 14, paddingHorizontal: 36, borderRadius: 100, width: '100%', alignItems: 'center' }}
                            onPress={handleNextTourStep}
                        >
                            <Text style={{ color: colors.onPrimary, fontWeight: 'bold', fontSize: 16 }}>
                                {tourStep < 3 ? 'Next Tip' : 'Get Started'}
                            </Text>
                        </SoundButton>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { paddingBottom: 120 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, paddingTop: 60 },
    menuTrigger: { padding: 4 },
    userName: { fontSize: 24, fontWeight: '400', letterSpacing: -0.8 },
    profileBox: { width: 44, height: 44, borderRadius: 22, overflow: 'hidden' },
    avatar: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
    assetCard: { margin: 20, borderRadius: 36, elevation: 8, overflow: 'visible' },
    accentMoney: { position: 'absolute', right: -20, bottom: -20, opacity: 0.1 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    rangeFilterContainer: { position: 'relative', marginBottom: 14, zIndex: 1001 },
    rangeFilterButton: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center' },
    rangeFilterText: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.9)' },
    rangeDropdown: { 
        position: 'absolute', 
        top: 48, 
        left: 0, 
        right: 0, 
        borderRadius: 20, 
        padding: 8, 
        zIndex: 1002, 
        elevation: 12,
        borderWidth: 1,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    rangeDropdownItem: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, marginBottom: 2 },
    rangeDropdownText: { fontSize: 14, fontWeight: '500' },
    cardTag: { fontSize: 12, fontWeight: '700', letterSpacing: 1.5 },
    balanceText: { fontSize: 42, fontWeight: '500', marginBottom: 28, letterSpacing: -1 },
    statsStrip: { flexDirection: 'row', gap: 12 },
    statPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, elevation: 4 },
    statValue: { fontSize: 14, fontWeight: '700' },
    shortcuts: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 20, marginBottom: 40 },
    shortcutItem: { alignItems: 'center', gap: 8 },
    shortcutIcon: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
    shortcutLabel: { fontSize: 12, fontWeight: '500' },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginBottom: 16 },
    sectionTitle: { fontSize: 20, fontWeight: '400' },
    timeChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
    timeText: { fontSize: 12, fontWeight: '700' },
    chartWrapper: { marginHorizontal: 20, padding: 0 },
    recentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 24, marginTop: 32, marginBottom: 16 },
    recentFlows: { gap: 0 },
    txCard: { marginHorizontal: 20, marginBottom: 12, padding: 0 },
    txInner: { flexDirection: 'row', alignItems: 'center' },
    txIconBox: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    txInfo: { flex: 1 },
    txTitle: { fontSize: 16, fontWeight: '500' },
    txDate: { fontSize: 13, marginTop: 2 },
    txValue: { fontSize: 16, fontWeight: '600' },
    mainFab: { position: 'absolute', bottom: 30, right: 20, width: 64, height: 64, borderRadius: 16, justifyContent: 'center', alignItems: 'center', elevation: 8 },
    modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', flexDirection: 'row' },
    bottomDrawerBackdrop: { flex: 1, justifyContent: 'flex-end' },
    sidebar: { width: '80%', height: '100%', padding: 24, paddingTop: 24 },
    sidebarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    brand: { fontSize: 28, fontWeight: '400', letterSpacing: -1 },
    sidebarMenu: { gap: 8 },
    menuItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 20 },
    menuIconContainer: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 18 },
    menuText: { fontSize: 18, fontWeight: '400' },
    sidebarFooter: { position: 'absolute', bottom: 40, left: 24, right: 24 },
    proBanner: { padding: 20, borderRadius: 24, flexDirection: 'row', gap: 12, alignItems: 'center' },
    section: { marginBottom: 32 },
    budgetGrid: { paddingHorizontal: 20, gap: 12 },
    budgetCard: { padding: 16, borderRadius: 24, elevation: 1 },
    budgetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    budgetName: { fontSize: 16, fontWeight: '500' },
    budgetDetail: { fontSize: 12, fontWeight: '700' },
    budgetProgressBg: { height: 8, borderRadius: 4, overflow: 'hidden' },
    budgetProgressBar: { height: '100%', borderRadius: 4 },
    customizeBtn: { padding: 16, marginHorizontal: 20, marginTop: 10, borderRadius: 16, borderWidth: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12 },
    modalCard: { padding: 24, borderTopLeftRadius: 36, borderTopRightRadius: 36, maxHeight: '80%' },
    modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    modalTitle: { fontSize: 22, fontWeight: '700' },
    widgetCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 24, borderWidth: 1, gap: 16 },
    widgetIconBox: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    widgetTitle: { fontSize: 16, fontWeight: '600', marginBottom: 2 },
    widgetDesc: { fontSize: 13, lineHeight: 18 }
});

export default Dashboard;