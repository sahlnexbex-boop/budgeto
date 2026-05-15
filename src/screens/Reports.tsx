import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, Dimensions, Platform, Modal, Pressable } from 'react-native';
import SoundButton from '../components/SoundButton';
import { PieChart } from 'react-native-gifted-charts';
import { useTheme } from '../theme/ThemeContext';
import { dbService } from '../database/db';
import {
    Calendar as CalIcon, ChevronDown, ChevronLeft, ChevronRight,
    Plus, Layout as LayoutIcon, Search, Menu, Filter
} from 'lucide-react-native';
import Background from '../components/Background';
import GlassCard from '../components/GlassCard';
import {
    format, startOfWeek, endOfWeek, startOfMonth, endOfMonth,
    startOfYear, endOfYear, addMonths, subMonths, addWeeks,
    subWeeks, addYears, subYears, isWithinInterval
} from 'date-fns';
import { CATEGORY_ICONS } from '../utils/iconLibrary';

const { width } = Dimensions.get('window');

const Reports = ({ navigation }: any) => {
    const { theme, currency, colors } = useTheme();
    const [pieData, setPieData] = useState<any[]>([]);
    const [totalValue, setTotalValue] = useState(0);
    const [reportType, setReportType] = useState<'expense' | 'income'>('expense');
    const [period, setPeriod] = useState<'Week' | 'Month' | 'Year'>('Month');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [categoryList, setCategoryList] = useState<any[]>([]);
    const [showSortModal, setShowSortModal] = useState(false);
    const [showDateModal, setShowDateModal] = useState(false);
    const [sortOption, setSortOption] = useState<'highest' | 'lowest' | 'az'>('highest');

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', loadData);
        loadData();
        return unsubscribe;
    }, [navigation, period, currentDate, reportType, sortOption]);

    const loadData = async () => {
        let txs = await dbService.getTransactions();
        let interval: { start: Date; end: Date };

        if (period === 'Week') {
            interval = { start: startOfWeek(currentDate), end: endOfWeek(currentDate) };
        } else if (period === 'Month') {
            interval = { start: startOfMonth(currentDate), end: endOfMonth(currentDate) };
        } else {
            interval = { start: startOfYear(currentDate), end: endOfYear(currentDate) };
        }

        const filteredTxs = txs.filter((t: any) =>
            t.type === reportType &&
            isWithinInterval(new Date(t.date), interval)
        );

        let total = 0;
        const catMap: any = {};

        filteredTxs.forEach((t: any) => {
            total += t.amount;
            const name = t.category_name || 'Other';
            if (!catMap[name]) {
                catMap[name] = {
                    value: 0,
                    color: t.category_color || colors.primary,
                    label: name,
                    icon: t.icon || 'tag'
                };
            }
            catMap[name].value += t.amount;
        });

        setTotalValue(total);

        let sortedCats = Object.values(catMap);
        if (sortOption === 'highest') {
            sortedCats = sortedCats.sort((a: any, b: any) => b.value - a.value);
        } else if (sortOption === 'lowest') {
            sortedCats = sortedCats.sort((a: any, b: any) => a.value - b.value);
        } else if (sortOption === 'az') {
            sortedCats = sortedCats.sort((a: any, b: any) => a.label.localeCompare(b.label));
        }

        const pData = sortedCats.map((item: any) => ({
            value: item.value,
            color: item.color,
            label: item.label,
        }));

        setPieData(pData.length > 0 ? pData : [{ value: 0, color: colors.outline + '40', label: 'Empty' }]);
        setCategoryList(sortedCats);
    };

    const navigateDate = (direction: 'prev' | 'next') => {
        if (period === 'Week') {
            setCurrentDate(direction === 'prev' ? subWeeks(currentDate, 1) : addWeeks(currentDate, 1));
        } else if (period === 'Month') {
            setCurrentDate(direction === 'prev' ? subMonths(currentDate, 1) : addMonths(currentDate, 1));
        } else {
            setCurrentDate(direction === 'prev' ? subYears(currentDate, 1) : addYears(currentDate, 1));
        }
    };

    const getDateLabel = () => {
        const today = new Date();
        if (period === 'Week') {
            const start = startOfWeek(currentDate);
            const todayStart = startOfWeek(today);
            if (start.getTime() === todayStart.getTime()) return 'This Week';
            return `${format(start, 'MMM dd')} - ${format(endOfWeek(currentDate), 'dd')}`;
        } else if (period === 'Month') {
            const start = startOfMonth(currentDate);
            const todayStart = startOfMonth(today);
            if (start.getTime() === todayStart.getTime()) return 'This Month';
            if (start.getTime() === startOfMonth(subMonths(today, 1)).getTime()) return 'Last Month';
            return format(currentDate, 'MMMM yyyy');
        } else if (period === 'Year') {
            const start = startOfYear(currentDate);
            const todayStart = startOfYear(today);
            if (start.getTime() === todayStart.getTime()) return 'This Year';
            return format(currentDate, 'yyyy');
        }
        return format(currentDate, 'yyyy');
    };

    const currencySymbols: { [key: string]: string } = {
        'INR': '₹', 'USD': '$', 'EUR': '€', 'GBP': '£', 'JPY': '¥'
    };
    const symbol = currencySymbols[currency] || '₹';

    return (
        <Background>
            <View style={styles.topSection}>
                <View style={styles.navHeader}>
                    <SoundButton style={styles.navBtn} onPress={() => setShowSortModal(true)}>
                        <Filter color={colors.onSurface} size={24} />
                    </SoundButton>
                    <SoundButton
                        style={styles.titleContainer}
                        onPress={() => setReportType(reportType === 'expense' ? 'income' : 'expense')}
                    >
                        <Text style={[styles.mainTitle, { color: colors.onSurface }]}>
                            {reportType === 'expense' ? 'Expenses' : 'Income'}
                        </Text>
                        <ChevronDown size={18} color={colors.onSurfaceVariant} />
                    </SoundButton>
                    <SoundButton style={styles.navBtn} onPress={() => setShowDateModal(true)}>
                        <CalIcon color={colors.onSurface} size={24} />
                    </SoundButton>
                </View>

                {/* Period Selector Tabs */}
                <View style={styles.periodTabs}>
                    {['Week', 'Month', 'Year'].map((p: any) => (
                        <SoundButton
                            key={p}
                            style={[
                                styles.tab,
                                period === p && { backgroundColor: theme === 'dark' ? '#FFFFFF' : '#1C1B1F' }
                            ]}
                            onPress={() => {
                                setPeriod(p);
                                setCurrentDate(new Date());
                            }}
                        >
                            <Text style={[
                                styles.tabText,
                                { color: period === p ? (theme === 'dark' ? '#000000' : '#FFFFFF') : colors.onSurfaceVariant }
                            ]}>
                                {p}
                            </Text>
                        </SoundButton>
                    ))}
                </View>

                {/* Date Navigation Swiper */}
                <View style={[styles.dateSwiper, { borderBottomColor: colors.outline + '20' }]}>
                    <SoundButton onPress={() => navigateDate('prev')}>
                        <Text style={[styles.swiperSideText, { color: colors.onSurfaceVariant }]}>
                            {period === 'Month' ? format(subMonths(currentDate, 1), 'MMM') : (period === 'Week' ? 'Prev' : format(subYears(currentDate, 1), 'yyyy'))}
                        </Text>
                    </SoundButton>
                    <View style={styles.activeDateBox}>
                        <Text style={[styles.activeDateText, { color: colors.primary }]}>{getDateLabel()}</Text>
                        <View style={[styles.activeIndicator, { backgroundColor: colors.primary }]} />
                    </View>
                    <SoundButton onPress={() => navigateDate('next')}>
                        <Text style={[styles.swiperSideText, { color: colors.onSurfaceVariant }]}>
                            {period === 'Month' ? format(addMonths(currentDate, 1), 'MMM') : (period === 'Week' ? 'Next' : format(addYears(currentDate, 1), 'yyyy'))}
                        </Text>
                    </SoundButton>
                </View>
            </View>

            <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.chartSection}>
                    <View style={styles.pieContainer}>
                        <PieChart
                            data={pieData}
                            donut
                            radius={width * 0.2}
                            innerRadius={width * 0.15}
                            innerCircleColor={colors.background}
                            centerLabelComponent={() => (
                                <Text style={{ color: colors.onSurface, fontSize: 18, fontWeight: '700' }}>
                                    {totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </Text>
                            )}
                        />
                    </View>
                    <View style={styles.legendWrapper}>
                        {categoryList.slice(0, 5).map((item, idx) => (
                            <View key={idx} style={styles.legendItem}>
                                <View style={[styles.dot, { backgroundColor: item.color }]} />
                                <Text style={[styles.legendName, { color: colors.onSurface }]} numberOfLines={1}>{item.label}</Text>
                                <Text style={[styles.legendPercent, { color: colors.onSurfaceVariant, textAlign: 'right', minWidth: 45 }]}>
                                    {totalValue > 0 ? ((item.value / totalValue) * 100).toFixed(1) : 0}%
                                </Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Detailed Category List */}
                <View style={styles.listSection}>
                    {categoryList.map((cat, idx) => {
                        const Icon = CATEGORY_ICONS[cat.icon] || CATEGORY_ICONS.tag;
                        const percent = totalValue > 0 ? (cat.value / totalValue) * 100 : 0;
                        return (
                            <View key={idx}>
                                <View style={styles.catItem}>
                                    <View style={[styles.iconCircle, { backgroundColor: colors.primaryContainer }]}>
                                        <Icon size={20} color={colors.primary} />
                                    </View>
                                    <View style={styles.itemDetail}>
                                        <View style={styles.itemHeader}>
                                            <Text style={[styles.catName, { color: colors.onSurface }]}>{cat.label}</Text>
                                            <Text style={[styles.catPercent, { color: colors.onSurfaceVariant, marginLeft: 8 }]}>{percent.toFixed(2)}%</Text>
                                        </View>
                                        <View style={[styles.progressBg, { backgroundColor: colors.outline + '20' }]}>
                                            <View style={[styles.progressBar, { width: `${percent}%`, backgroundColor: colors.primary }]} />
                                        </View>
                                    </View>
                                    <Text style={[styles.catAmount, { color: colors.onSurface, fontWeight: '700' }]}>
                                        {cat.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </Text>
                                </View>
                            </View>
                        );
                    })}
                </View>
            </ScrollView>

            {/* Sort Modal */}
            <Modal visible={showSortModal} transparent animationType="slide" onRequestClose={() => setShowSortModal(false)}>
                <View style={styles.modalOverlay}>
                    <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowSortModal(false)} />
                    <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.modalTitle, { color: colors.onSurface }]}>Sort Categories</Text>
                        {['highest', 'lowest', 'az'].map((opt) => (
                            <SoundButton
                                key={opt}
                                style={styles.modalOptionBtn}
                                onPress={() => { setSortOption(opt as any); setShowSortModal(false); }}
                            >
                                <Text style={[styles.modalOptionText, { color: sortOption === opt ? colors.primary : colors.onSurface }]}>
                                    {opt === 'highest' ? 'Highest Amount' : opt === 'lowest' ? 'Lowest Amount' : 'Alphabetical (A-Z)'}
                                </Text>
                            </SoundButton>
                        ))}
                        <SoundButton style={[styles.modalOptionBtn, { borderBottomWidth: 0, marginTop: 10, alignSelf: 'center' }]} onPress={() => setShowSortModal(false)}>
                            <Text style={[{ color: colors.primary, fontSize: 16, fontWeight: '700' }]}>Close</Text>
                        </SoundButton>
                    </View>
                </View>
            </Modal>

            {/* Date Quick Jump Modal */}
            <Modal visible={showDateModal} transparent animationType="slide" onRequestClose={() => setShowDateModal(false)}>
                <View style={styles.modalOverlay}>
                    <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowDateModal(false)} />
                    <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.modalTitle, { color: colors.onSurface }]}>Quick Jump</Text>
                        <SoundButton style={styles.modalOptionBtn} onPress={() => { setPeriod('Week'); setCurrentDate(new Date()); setShowDateModal(false); }}>
                            <Text style={[styles.modalOptionText, { color: colors.onSurface }]}>This Week</Text>
                        </SoundButton>
                        <SoundButton style={styles.modalOptionBtn} onPress={() => { setPeriod('Month'); setCurrentDate(new Date()); setShowDateModal(false); }}>
                            <Text style={[styles.modalOptionText, { color: colors.onSurface }]}>This Month</Text>
                        </SoundButton>
                        <SoundButton style={styles.modalOptionBtn} onPress={() => { setPeriod('Month'); setCurrentDate(subMonths(new Date(), 1)); setShowDateModal(false); }}>
                            <Text style={[styles.modalOptionText, { color: colors.onSurface }]}>Last Month</Text>
                        </SoundButton>
                        <SoundButton style={styles.modalOptionBtn} onPress={() => { setPeriod('Year'); setCurrentDate(new Date()); setShowDateModal(false); }}>
                            <Text style={[styles.modalOptionText, { color: colors.onSurface }]}>This Year</Text>
                        </SoundButton>
                        <SoundButton style={[styles.modalOptionBtn, { borderBottomWidth: 0, marginTop: 10, alignSelf: 'center' }]} onPress={() => setShowDateModal(false)}>
                            <Text style={[{ color: colors.primary, fontSize: 16, fontWeight: '700' }]}>Close</Text>
                        </SoundButton>
                    </View>
                </View>
            </Modal>

            {/* Bottom FAB */}
            <SoundButton
                style={[styles.fab, { backgroundColor: colors.primary }]}
                onPress={() => navigation.navigate('AddTransaction')}
            >
                <Plus color={colors.onPrimary} size={32} />
            </SoundButton>
        </Background>
    );
};

const styles = StyleSheet.create({
    topSection: { paddingTop: 60, paddingBottom: 10 },
    navHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 20 },
    navBtn: { padding: 8 },
    titleContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    mainTitle: { fontSize: 22, fontWeight: '600' },
    periodTabs: { flexDirection: 'row', marginHorizontal: 20, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 12, padding: 4, marginBottom: 20 },
    tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
    tabText: { fontSize: 14, fontWeight: '600' },
    dateSwiper: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 40, borderBottomWidth: 1, paddingBottom: 10 },
    swiperSideText: { fontSize: 14, fontWeight: '500', opacity: 0.6 },
    activeDateBox: { alignItems: 'center' },
    activeDateText: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
    activeIndicator: { width: 30, height: 3, borderRadius: 2 },
    container: { flex: 1 },
    content: { paddingBottom: 120 },
    chartSection: { flexDirection: 'row', padding: 24, alignItems: 'center', justifyContent: 'space-between' },
    pieContainer: { flex: 1.2, alignItems: 'center' },
    legendWrapper: { flex: 1.4, gap: 10, paddingLeft: 8 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    dot: { width: 8, height: 8, borderRadius: 4 },
    legendName: { fontSize: 12, fontWeight: '500', flex: 1 },
    legendPercent: { fontSize: 11, minWidth: 40, textAlign: 'right' },
    listSection: { paddingHorizontal: 20 },
    catItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, gap: 16 },
    iconCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    itemDetail: { flex: 1, gap: 8 },
    itemHeader: { flexDirection: 'row', gap: 8, alignItems: 'baseline' },
    catName: { fontSize: 16, fontWeight: '600' },
    catPercent: { fontSize: 12 },
    progressBg: { height: 6, borderRadius: 3, overflow: 'hidden' },
    progressBar: { height: '100%', borderRadius: 3 },
    catAmount: { fontSize: 16, fontWeight: '700', width: 90, textAlign: 'right' },
    fab: { position: 'absolute', bottom: 20, alignSelf: 'center', width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', elevation: 8, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10, zIndex: 10 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalCard: { padding: 24, paddingBottom: 40, borderTopLeftRadius: 36, borderTopRightRadius: 36 },
    modalTitle: { fontSize: 24, fontWeight: '700', marginBottom: 20 },
    modalOptionBtn: { paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: 'rgba(150,150,150,0.1)' },
    modalOptionText: { fontSize: 18, fontWeight: '500' }
});

export default Reports;