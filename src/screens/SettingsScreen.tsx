import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { useBudgetStore } from '../store/useBudgetStore';
import { useThemeStore, ThemeMode } from '../store/useThemeStore';
import { useColors, Colors } from '../theme';

const modes: [ThemeMode, string][] = [
  ['system', 'Sistem'],
  ['light', 'Açık'],
  ['dark', 'Koyu'],
];

export default function SettingsScreen() {
  const { transactions, categories, budgets, recurring } = useBudgetStore();
  const { mode, setMode } = useThemeStore();
  const c = useColors();
  const styles = useMemo(() => makeStyles(c), [c]);
  const [text, setText] = useState('');

  const buildJson = () =>
    JSON.stringify(
      {
        app: 'butce-takip',
        version: 1,
        exportedAt: new Date().toISOString(),
        transactions,
        categories,
        budgets,
        recurring,
      },
      null,
      2,
    );

  const buildCsv = () => {
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const rows = ['Tarih,Tür,Kategori,Tutar (TL),Not'];
    [...transactions]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .forEach(t => {
        const cat = categories.find(x => x.id === t.categoryId);
        rows.push(
          [
            format(new Date(t.date), 'yyyy-MM-dd'),
            t.type === 'income' ? 'Gelir' : 'Gider',
            esc(cat?.name ?? ''),
            (t.amount / 100).toFixed(2),
            esc(t.note ?? ''),
          ].join(','),
        );
      });
    return rows.join('\n');
  };

  const share = async (message: string, title: string) => {
    try {
      await Share.share({ message, title });
    } catch (e) {
      Alert.alert('Paylaşılamadı', 'Bu cihazda paylaşım açılamadı.');
    }
  };

  const restore = () => {
    let data: any;
    try {
      data = JSON.parse(text.trim());
    } catch (e) {
      Alert.alert('Hata', 'Metin geçerli bir yedek değil. Yedeğin tamamını yapıştırdığından emin ol.');
      return;
    }
    if (
      !data ||
      !Array.isArray(data.transactions) ||
      !Array.isArray(data.categories) ||
      data.categories.length === 0 ||
      !Array.isArray(data.budgets)
    ) {
      Alert.alert('Hata', 'Bu metin bu uygulamanın yedeği gibi görünmüyor.');
      return;
    }
    Alert.alert(
      'Geri yükle',
      `${data.transactions.length} işlem geri yüklenecek. Şu anki veriler silinip bunlarla değiştirilecek. Devam edilsin mi?`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Geri yükle',
          style: 'destructive',
          onPress: () => {
            useBudgetStore.setState({
              transactions: data.transactions,
              categories: data.categories,
              budgets: data.budgets,
              recurring: Array.isArray(data.recurring) ? data.recurring : [],
            });
            setText('');
            Alert.alert('Tamam', 'Veriler geri yüklendi.');
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Ayarlar</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Görünüm</Text>
          <View style={{ flexDirection: 'row' }}>
            {modes.map(([k, label]) => (
              <TouchableOpacity
                key={k}
                onPress={() => setMode(k)}
                style={[styles.chip, mode === k && styles.chipActive]}>
                <Text style={mode === k ? styles.chipTextActive : styles.chipText}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Text style={styles.desc}>
          Şu an {transactions.length} işlem, {categories.length} kategori kayıtlı. Veriler
          sadece bu telefonda durur, uygulama silinirse kaybolur. Düzenli yedek al.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Yedek al</Text>
          <TouchableOpacity style={styles.btn} onPress={() => setText(buildJson())}>
            <Text style={styles.btnText}>Yedeği hazırla (kutuya yaz)</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.btn}
            onPress={() => share(buildJson(), 'Bütçe yedeği')}>
            <Text style={styles.btnText}>Yedeği paylaş</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btn, styles.btnGray]}
            onPress={() => share(buildCsv(), 'Bütçe işlemleri (CSV)')}>
            <Text style={[styles.btnText, { color: c.text }]}>İşlemleri CSV olarak paylaş</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Yedek metni</Text>
          <Text style={styles.hint}>
            Geri yüklemek için yedeğin tamamını buraya yapıştır. Yedek almak için üstteki
            "hazırla" düğmesine bas, metne uzun basıp tümünü kopyalayabilirsin.
          </Text>
          <TextInput
            style={styles.box}
            multiline
            value={text}
            onChangeText={setText}
            placeholder="Yedek metni burada görünür veya buraya yapıştırılır"
            placeholderTextColor={c.muted}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: c.danger }]}
            onPress={restore}
            disabled={!text.trim()}>
            <Text style={styles.btnText}>Geri yükle</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg },
    title: { fontSize: 22, fontWeight: '700', marginBottom: 12, color: c.text },
    desc: { color: c.sub, fontSize: 13, marginBottom: 12 },
    card: { backgroundColor: c.card, borderRadius: 16, padding: 16, marginBottom: 12, gap: 10 },
    cardTitle: { fontSize: 16, fontWeight: '600', color: c.text },
    hint: { color: c.muted, fontSize: 12 },
    chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: c.chip, marginRight: 6 },
    chipActive: { backgroundColor: c.chipActive },
    chipText: { color: c.chipText },
    chipTextActive: { color: c.chipTextActive },
    btn: { backgroundColor: c.primary, padding: 14, borderRadius: 10, alignItems: 'center' },
    btnGray: { backgroundColor: c.chip },
    btnText: { color: '#fff', fontWeight: '600' },
    box: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 10,
      padding: 10,
      minHeight: 140,
      maxHeight: 260,
      textAlignVertical: 'top',
      fontSize: 12,
      color: c.text,
    },
  });