import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { colors } from "../constants/theme";
import {
  addAdvance,
  advancesFor,
  dh,
  fmtISO,
  removeAdvance,
  removeWorker,
  setRate,
  useAppState,
  weekDates,
  weekDaysWorked,
} from "../lib/store";

export default function Wages() {
  const { state, update, ready } = useAppState();
  const [week, setWeek] = useState(0);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [advanceDrafts, setAdvanceDrafts] = useState<Record<string, string>>({});

  if (!ready) return <View style={styles.container} />;

  const dates = weekDates(week);
  let grandTotal = 0;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <View style={styles.weekRow}>
        <Pressable
          style={styles.weekBtn}
          accessibilityLabel="Previous week"
          onPress={() => setWeek(week - 1)}
        >
          <Ionicons name="chevron-back" size={20} color={colors.blue} />
        </Pressable>
        <Text style={styles.weekLabel}>
          Week of {fmtISO(dates[0])}
          {week === 0 ? " (this week)" : ""}
        </Text>
        <Pressable
          style={styles.weekBtn}
          accessibilityLabel="Next week"
          onPress={() => setWeek(week + 1)}
        >
          <Ionicons name="chevron-forward" size={20} color={colors.blue} />
        </Pressable>
      </View>

      {state.workers.map((w) => {
        const { count, future } = weekDaysWorked(state, w.id, week);
        const pay = count * w.rate;
        const advances = advancesFor(state, w.id);
        const taken = advances.reduce((n, a) => n + a.amount, 0);
        const net = pay - taken;
        grandTotal += net;
        const advanceText = advanceDrafts[w.id] ?? "";

        return (
          <View key={w.id} style={styles.card}>
            <View style={styles.cardHead}>
              <Text style={styles.workerName}>{w.name}</Text>
              <Pressable
                accessibilityLabel={`Remove ${w.name}`}
                onPress={() => update((s) => removeWorker(s, w.id))}
              >
                <Ionicons name="trash-outline" size={20} color={colors.red} />
              </Pressable>
            </View>

            <View style={styles.rateRow}>
              <Text style={styles.rateLabel}>DH / day</Text>
              <TextInput
                style={styles.rateInput}
                value={drafts[w.id] ?? String(w.rate)}
                onChangeText={(t) => setDrafts({ ...drafts, [w.id]: t })}
                onBlur={() => {
                  const n = parseInt(drafts[w.id] ?? "", 10);
                  if (n > 0 && n !== w.rate) update((s) => setRate(s, w.id, n));
                  setDrafts({ ...drafts, [w.id]: String(n > 0 ? n : w.rate) });
                }}
                keyboardType="number-pad"
              />
            </View>

            <View style={styles.statRow}>
              <View style={styles.stat}>
                <Text style={styles.statNum}>{count}</Text>
                <Text style={styles.statLabel}>day(s) worked{future ? ` (+${future} future)` : ""}</Text>
              </View>
              <View style={styles.stat}>
                <Text style={[styles.statNum, styles.blue]}>{dh(pay)}</Text>
                <Text style={styles.statLabel}>pay before advances</Text>
              </View>
            </View>

            <View style={styles.advanceBox}>
              <Text style={styles.advanceTitle}>Money taken (DH)</Text>
              {advances.map((a) => (
                <View key={a.id} style={styles.advanceRow}>
                  <Text style={styles.advanceText}>
                    {a.date} — {dh(a.amount)}
                  </Text>
                  <Pressable
                    accessibilityLabel={`Remove advance of ${a.amount} DH`}
                    onPress={() => update((s) => removeAdvance(s, a.id))}
                  >
                    <Ionicons name="close" size={18} color={colors.red} />
                  </Pressable>
                </View>
              ))}
              <View style={styles.advanceInputRow}>
                <TextInput
                  style={styles.advanceInput}
                  placeholder="Amount he took"
                  placeholderTextColor={colors.muted}
                  value={advanceText}
                  onChangeText={(t) => setAdvanceDrafts({ ...advanceDrafts, [w.id]: t })}
                  keyboardType="number-pad"
                />
                <Pressable
                  style={[styles.btnSmall, !(parseInt(advanceText, 10) > 0) && styles.btnDisabled]}
                  disabled={!(parseInt(advanceText, 10) > 0)}
                  onPress={() => {
                    update((s) => addAdvance(s, w.id, parseInt(advanceText, 10)));
                    setAdvanceDrafts({ ...advanceDrafts, [w.id]: "" });
                  }}
                >
                  <Text style={styles.btnSmallText}>Add</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.netRow}>
              <Text style={styles.netLabel}>NET TO PAY</Text>
              <Text style={[styles.netValue, net < 0 && styles.negative]}>{dh(net)}</Text>
            </View>
          </View>
        );
      })}

      <View style={styles.totalBanner}>
        <Text style={styles.totalLabel}>TOTAL TO PAY THIS WEEK</Text>
        <Text style={styles.totalValue}>{dh(grandTotal)}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.surface },
  content: { padding: 16, gap: 16, paddingBottom: 32 },
  weekRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  weekBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  weekLabel: { color: colors.text, fontWeight: "600" },
  card: { backgroundColor: colors.card, borderRadius: 14, padding: 16, gap: 12, borderWidth: 1, borderColor: colors.border },
  cardHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  workerName: { color: colors.navy, fontWeight: "800", fontSize: 18 },
  rateRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  rateLabel: { color: colors.muted, fontSize: 13 },
  rateInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    width: 100,
    color: colors.blue,
    fontWeight: "700",
  },
  statRow: { flexDirection: "row", gap: 12 },
  stat: { flex: 1, backgroundColor: colors.light, borderRadius: 8, padding: 10 },
  statNum: { color: colors.text, fontWeight: "800", fontSize: 16 },
  blue: { color: colors.blue },
  statLabel: { color: colors.muted, fontSize: 11 },
  advanceBox: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 10, gap: 6 },
  advanceTitle: { color: colors.navy, fontWeight: "700", fontSize: 13 },
  advanceRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  advanceText: { color: colors.text, fontSize: 13 },
  advanceInputRow: { flexDirection: "row", gap: 8 },
  advanceInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
    color: colors.text,
  },
  btnSmall: { backgroundColor: colors.blue, borderRadius: 8, paddingHorizontal: 16, alignItems: "center", justifyContent: "center" },
  btnSmallText: { color: colors.white, fontWeight: "600" },
  btnDisabled: { opacity: 0.5 },
  netRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.light,
    borderRadius: 8,
    padding: 10,
  },
  netLabel: { color: colors.navy, fontWeight: "700", fontSize: 12 },
  netValue: { color: colors.blue, fontWeight: "800", fontSize: 18 },
  negative: { color: colors.red },
  totalBanner: { backgroundColor: colors.navy, borderRadius: 14, padding: 16, alignItems: "center", gap: 4 },
  totalLabel: { color: "#BFD4F2", fontWeight: "700", fontSize: 12, letterSpacing: 1 },
  totalValue: { color: colors.white, fontWeight: "800", fontSize: 26 },
  container: { flex: 1, backgroundColor: colors.surface },
});
