import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PieChart, BarChart } from 'react-native-gifted-charts';
import { addMonths, subMonths, format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useBudgetStore } from '../store/useBudgetStore';
import { monthlySummary, spentByCategory } from '../utils/stats';
import { formatTL } from '../utils/money';
import { useColors, useIsDark, Colors } from '../constants/theme';

const chartWidth = Dimensions.get('window').width - 64;

export default function StatsScreen() {
  const { transactions, categories } = useBudgetStore();
  const th = useColors();
  const isDark = useIsDark();
  const styles = useMemo(() => makeStyles(th), [th]);
  const [month, setMonth] = useState(new Date());

  const summary = useMemo(() => monthlySummary(transactions, month), [transactions, month]);

  const byCategory = useMemo(() => {
    const map = spentByCategory(transactions, month);
    return Object.keys(map)
      .map(id => {
        const cat = categories.find(c => c.id === id);
        return {
          id,
          name: cat?.name ?? 'Diğer',
          icon: cat?.icon ?? '•',
          color: cat?.color ?? '#94a3b8',
          amount: map[id],
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [transactions, categories, month]);

  const totalExpense = byCategory.reduce((a, c) => a + c.amount, 0);

  const pieData = byCategory.map(c => ({ value: c.amount / 100, color: c.color }));

  const barData = useMemo(() => {
    const items = [];
    for (let i = 5; i >= 0; i--) {
      const m = subMonths(month, i);
      items.push({
        value: monthlySummary(transactions, m).expense / 100,
        label: format(m, 'MMM', { locale: tr }),
        frontColor: i === 0 ? th.primary : isDark ? '#334e7a' : '#93c5fd',
      });
    }
    return items;
  }, [transactions, month, th.primary, isDark]);

  const maxBar = Math.max(...barData.map(b => b.value), 100);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={styles.monthRow}>
          <TouchableOpacity onPress={() => setMonth(m => subMonths(m, 1))} style={styles.arrow}>
            <Text style={styles.arrowText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.monthText}>
            {format(month, 'LLLL yyyy', { locale: tr })}
          </Text>
          <TouchableOpacity onPress={() => setMonth(m => addMonths(m, 1))} style={styles.arrow}>
            <Text style={styles.arrowText}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.sumBox}>
            <Text style={styles.sumLabel}>Gelir</Text>
            <Text style={[styles.sumValue, { color: '#22c55e' }]}>{formatTL(summary.income)}</Text>
          </View>
          <View style={styles.sumBox}>
            <Text style={styles.sumLabel}>Gider</Text>
            <Text style={[styles.sumValue, { color: '#ef4444' }]}>{formatTL(summary.expense)}</Text>
          </View>
          <View style={styles.sumBox}>
            <Text style={styles.sumLabel}>Kalan</Text>
            <Text style={styles.sumValue}>{formatTL(summary.balance)}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Kategori dağılımı</Text>
          {byCategory.length === 0 ? (
            <Text style={styles.empty}>Bu ay gider yok</Text>
          ) : (
            <>
              <View style={{ alignItems: 'center', marginVertical: 12 }}>
                <PieChart
                  data={pieData}
                  donut
                  radius={90}
                  innerRadius={55}
                  innerCircleColor={th.card}
                  centerLabelComponent={() => (
                    <View style={{ alignItems: 'center' }}>
                      <Text style={{ fontSize: 11, color: th.sub }}>Toplam</Text>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: th.text }}>
                        {formatTL(totalExpense)}
                      </Text>
                    </View>
                  )}
                />
              </View>
              {byCategory.map(c => (
                <View key={c.id} style={styles.legendRow}>
                  <View style={[styles.dot, { backgroundColor: c.color }]} />
                  <Text style={styles.legendName}>
                    {c.icon} {c.name}
                  </Text>
                  <Text style={styles.legendPct}>
                    %{Math.round((c.amount / totalExpense) * 100)}
                  </Text>
                  <Text style={styles.legendAmount}>{formatTL(c.amount)}</Text>
                </View>
              ))}
            </>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Son 6 ay gider (TL)</Text>
          <View style={{ marginTop: 16, overflow: 'hidden' }}>
            <BarChart
              data={barData}
              width={chartWidth - 40}
              barWidth={28}
              spacing={16}
              initialSpacing={10}
              noOfSections={4}
              maxValue={maxBar * 1.1}
              yAxisThickness={0}
              xAxisThickness={0}
              roundedTop
              rulesColor={th.border}
              yAxisTextStyle={{ color: th.muted, fontSize: 10 }}
              xAxisLabelTextStyle={{ color: th.sub, fontSize: 11 }}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg },
    monthRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    monthText: { fontSize: 18, fontWeight: '700', textTransform: 'capitalize', color: c.text },
    arrow: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: c.chip,
      alignItems: 'center',
      justifyContent: 'center',
    },
    arrowText: { fontSize: 22, color: c.text },
    summaryRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
    sumBox: { flex: 1, backgroundColor: c.card, borderRadius: 12, padding: 12 },
    sumLabel: { color: c.sub, fontSize: 12 },
    sumValue: { fontSize: 14, fontWeight: '700', marginTop: 4, color: c.text },
    card: { backgroundColor: c.card, borderRadius: 16, padding: 16, marginBottom: 12 },
    cardTitle: { fontSize: 16, fontWeight: '600', color: c.text },
    empty: { color: c.muted, textAlign: 'center', marginVertical: 24 },
    legendRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
    dot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
    legendName: { flex: 1, color: c.text },
    legendPct: { color: c.sub, width: 44, textAlign: 'right' },
    legendAmount: { fontWeight: '600', width: 100, textAlign: 'right', color: c.text },
  });