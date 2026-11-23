import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { colors } from "../constants/theme";
import {
  addCategory,
  addMoneyIn,
  addMoneyOut,
  deleteEntry,
  dh,
  removeCategory,
  useAppState,
} from "../lib/store";

export default function Money() {
  const { state, update, ready } = useAppState();
  const [tab, setTab] = useState<"in" | "out">("in");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [category, setCategory] = useState("");
  const [newCat, setNewCat] = useState("");

  if (!ready) return <View style={styles.container} />;

  const amountN = parseInt(amount, 10);
  const valid = amountN > 0;
  const entries = tab === "in" ? state.moneyIn : state.moneyOut;
  const total = entries.reduce((n, e) => n + e.amount, 0);

  const submit = () => {
    if (!valid) return;
    if (tab === "in") update((s) => addMoneyIn(s, amountN, note.trim()));
    else update((s) => addMoneyOut(s, amountN, category || "Other", note.trim()));
    setAmount("");
    setNote("");
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <View style={styles.seg}>
        {(["in", "out"] as const).map((t) => (
          <Pressable
            key={t}
            style={[styles.segBtn, tab === t && styles.segActive]}
            accessibilityLabel={t === "in" ? "Money in tab" : "Money out tab"}
            onPress={() => {
              setTab(t);
              setCategory("");
            }}
          >
            <Text style={[styles.segText, tab === t && styles.segTextActive]}>
              {t === "in" ? "Money In" : "Money Out"}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.form}>
        <Text style={styles.formTitle}>{tab === "in" ? "Add money in" : "Add money out"}</Text>
        <TextInput
          style={styles.input}
          placeholder="Amount (DH)"
          placeholderTextColor={colors.muted}
          value={amount}
          onChangeText={setAmount}
          keyboardType="number-pad"
        />
        {tab === "out" && (
          <View style={{ gap: 8 }}>
            <View style={styles.chips}>
              {state.categories.map((c) => (
                <Pressable
                  key={c}
                  style={[styles.chip, category === c && styles.chipActive]}
                  accessibilityLabel={`Category ${c}${category === c ? " selected" : ""}`}
                  onPress={() => setCategory(category === c ? "" : c)}
                >
                  <Text style={[styles.chipText, category === c && styles.chipTextActive]}>{c}</Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.newCatRow}>
              <TextInput
                style={styles.input}
                placeholder="New category"
                placeholderTextColor={colors.muted}
                value={newCat}
                onChangeText={setNewCat}
              />
              <Pressable
                style={[styles.btnSmall, !newCat.trim() && styles.btnDisabled]}
                disabled={!newCat.trim()}
                onPress={() => {
                  update((s) => addCategory(s, newCat.trim()));
                  setCategory(newCat.trim());
                  setNewCat("");
                }}
              >
                <Text style={styles.btnSmallText}>Add</Text>
              </Pressable>
            </View>
          </View>
        )}
        <TextInput
          style={styles.input}
          placeholder={tab === "in" ? "Note (optional)" : "Note (optional)"}
          placeholderTextColor={colors.muted}
          value={note}
          onChangeText={setNote}
        />
        <Pressable style={[styles.btn, !valid && styles.btnDisabled]} disabled={!valid} onPress={submit}>
          <Text style={styles.btnText}>{tab === "in" ? "Add money in" : "Add money out"}</Text>
        </Pressable>
        {tab === "out" && state.categories.length > 7 && (
          <Pressable onPress={() => update((s) => removeCategory(s, state.categories[state.categories.length - 1]))}>
            <Text style={styles.removeCat}>Remove last category</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.totalBanner}>
        <Text style={styles.totalLabel}>{tab === "in" ? "TOTAL MONEY IN" : "TOTAL MONEY OUT"}</Text>
        <Text style={styles.totalValue}>{dh(total)}</Text>
      </View>

      <View style={{ gap: 8 }}>
        {entries.length === 0 && (
          <Text style={styles.emptyText}>Nothing recorded yet — add your first entry above.</Text>
        )}
        {[...entries].reverse().map((e) => (
          <View key={e.id} style={styles.entryRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.entryMain}>
                {dh(e.amount)}
                {e.category ? ` — ${e.category}` : ""}
              </Text>
              <Text style={styles.entrySub}>
                {e.date}
                {e.note ? ` · ${e.note}` : ""}
              </Text>
            </View>
            <Pressable
              accessibilityLabel="Delete entry"
              onPress={() => update((s) => deleteEntry(s, tab, e.id))}
            >
              <Ionicons name="trash-outline" size={20} color={colors.red} />
            </Pressable>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.surface },
  content: { padding: 16, gap: 16, paddingBottom: 32 },
  seg: { flexDirection: "row", backgroundColor: colors.card, borderRadius: 10, padding: 4, borderWidth: 1, borderColor: colors.border },
  segBtn: { flex: 1, height: 44, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  segActive: { backgroundColor: colors.blue },
  segText: { color: colors.muted, fontWeight: "600" },
  segTextActive: { color: colors.white },
  form: { backgroundColor: colors.card, borderRadius: 14, padding: 16, gap: 10, borderWidth: 1, borderColor: colors.border },
  formTitle: { color: colors.navy, fontWeight: "700", fontSize: 16 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 12, height: 36, borderRadius: 18, backgroundColor: colors.light, alignItems: "center", justifyContent: "center" },
  chipActive: { backgroundColor: colors.blue },
  chipText: { color: colors.navy, fontWeight: "600", fontSize: 13 },
  chipTextActive: { color: colors.white },
  newCatRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 46,
    color: colors.text,
  },
  btn: { backgroundColor: colors.blue, borderRadius: 8, height: 46, alignItems: "center", justifyContent: "center" },
  btnSmall: { backgroundColor: colors.blue, borderRadius: 8, paddingHorizontal: 16, height: 46, alignItems: "center", justifyContent: "center" },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: colors.white, fontWeight: "600" },
  btnSmallText: { color: colors.white, fontWeight: "600" },
  removeCat: { color: colors.muted, fontSize: 12, textAlign: "center" },
  totalBanner: { backgroundColor: colors.navy, borderRadius: 14, padding: 16, alignItems: "center", gap: 4 },
  totalLabel: { color: "#BFD4F2", fontWeight: "700", fontSize: 12, letterSpacing: 1 },
  totalValue: { color: colors.white, fontWeight: "800", fontSize: 26 },
  entryRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  entryMain: { color: colors.text, fontWeight: "700" },
  entrySub: { color: colors.muted, fontSize: 12 },
  emptyText: { color: colors.muted, textAlign: "center", paddingVertical: 16 },
  container: { flex: 1, backgroundColor: colors.surface },
});
