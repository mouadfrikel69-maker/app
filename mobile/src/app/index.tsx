import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { colors } from "../constants/theme";
import {
  addWorker,
  cycleAttendance,
  dh,
  fmtDay,
  fmtISO,
  fmtMonthYear,
  removeWorker,
  useAppState,
  weekDates,
} from "../lib/store";

export default function Attendance() {
  const { state, update, ready } = useAppState();
  const [week, setWeek] = useState(0);
  const [name, setName] = useState("");
  const [rate, setRate] = useState("");
  const [adding, setAdding] = useState(false);

  if (!ready) return <View style={styles.container} />;

  const dates = weekDates(week);

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
          {fmtMonthYear(dates[0])} · week of {fmtDay(dates[0])}/{fmtDay(dates[6])}
        </Text>
        <Pressable
          style={styles.weekBtn}
          accessibilityLabel="Next week"
          onPress={() => setWeek(week + 1)}
        >
          <Ionicons name="chevron-forward" size={20} color={colors.blue} />
        </Pressable>
      </View>

      <View style={[styles.table, !state.workers.length && styles.empty]}>
        <View style={styles.row}>
          <View style={styles.nameCell}>
            <Text style={styles.headText}>Worker</Text>
          </View>
          {dates.map((d, i) => (
            <View key={i} style={styles.dayCell}>
              <Text style={styles.headText}>{["M", "T", "W", "T", "F", "S", "S"][i]}</Text>
              <Text style={styles.headSub}>{fmtDay(d)}</Text>
            </View>
          ))}
        </View>
        {state.workers.map((w) => (
          <View key={w.id} style={[styles.row, styles.bodyRow]}>
            <View style={styles.nameCell}>
              <Text style={styles.workerName} numberOfLines={1}>
                {w.name}
              </Text>
              <Text style={styles.workerRate}>{dh(w.rate)}/day</Text>
            </View>
            {dates.map((d, i) => {
              const mark = state.attendance[w.id + "|" + fmtISO(d)];
              return (
                <Pressable
                  key={i}
                  style={[styles.dayCell, styles.markBtn]}
                  accessibilityLabel={`${mark === "in" ? "Came to work" : mark === "out" ? "Did not come" : "Not marked"}: ${w.name}, ${fmtISO(d)}`}
                  onPress={() => update((s) => cycleAttendance(s, w.id, fmtISO(d)))}
                >
                  <Ionicons
                    name={mark === "in" ? "checkmark-circle" : mark === "out" ? "close-circle" : "ellipse-outline"}
                    size={26}
                    color={mark === "in" ? colors.green : mark === "out" ? colors.red : colors.border}
                  />
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <Ionicons name="checkmark-circle" size={16} color={colors.green} />
          <Text style={styles.legendText}>Came to work</Text>
        </View>
        <View style={styles.legendItem}>
          <Ionicons name="close-circle" size={16} color={colors.red} />
          <Text style={styles.legendText}>Did not come</Text>
        </View>
        <View style={styles.legendItem}>
          <Ionicons name="ellipse-outline" size={16} color={colors.border} />
          <Text style={styles.legendText}>Not marked yet</Text>
        </View>
      </View>

      {adding ? (
        <View style={styles.form}>
          <Text style={styles.formTitle}>Add worker</Text>
          <TextInput
            style={styles.input}
            placeholder="Name"
            placeholderTextColor={colors.muted}
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={styles.input}
            placeholder="DH per day (e.g. 150)"
            placeholderTextColor={colors.muted}
            value={rate}
            onChangeText={setRate}
            keyboardType="number-pad"
          />
          <View style={styles.formBtns}>
            <Pressable
              style={[styles.btn, styles.btnGhost]}
              onPress={() => {
                setAdding(false);
                setName("");
                setRate("");
              }}
            >
              <Text style={[styles.btnText, { color: colors.muted }]}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.btn, !name.trim() && styles.btnDisabled]}
              disabled={!name.trim()}
              onPress={() => {
                update((s) => addWorker(s, name.trim(), parseInt(rate, 10)));
                setAdding(false);
                setName("");
                setRate("");
              }}
            >
              <Text style={styles.btnText}>Add worker</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={styles.formBtns}>
          <Pressable style={styles.btn} onPress={() => setAdding(true)}>
            <Text style={styles.btnText}>+ Add worker</Text>
          </Pressable>
          {state.workers.length > 2 && (
            <Pressable
              style={[styles.btn, styles.btnGhost]}
              onPress={() =>
                update((s) => {
                  const name = s.workers[s.workers.length - 1]?.name;
                  if (!name) return s;
                  return removeWorker(s, s.workers[s.workers.length - 1].id);
                })
              }
            >
              <Text style={[styles.btnText, { color: colors.muted }]}>Remove last</Text>
            </Pressable>
          )}
        </View>
      )}
      <Text style={styles.hint}>Tap a day cell to cycle: came → did not come → clear.</Text>
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
  weekLabel: { color: colors.text, fontWeight: "600", flexShrink: 1, textAlign: "center" },
  table: { backgroundColor: colors.card, borderRadius: 14, overflow: "hidden", borderWidth: 1, borderColor: colors.border },
  empty: { alignItems: "center", padding: 24 },
  row: { flexDirection: "row", alignItems: "center", backgroundColor: colors.light, paddingVertical: 8 },
  bodyRow: { backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border },
  nameCell: { flex: 1, paddingHorizontal: 10, justifyContent: "center" },
  headText: { color: colors.navy, fontWeight: "700", fontSize: 12 },
  headSub: { color: colors.muted, fontSize: 11 },
  workerName: { color: colors.text, fontWeight: "700" },
  workerRate: { color: colors.blue, fontSize: 12 },
  dayCell: { width: 40, alignItems: "center", justifyContent: "center" },
  markBtn: { height: 48, justifyContent: "center" },
  legend: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  legendText: { color: colors.muted, fontSize: 12 },
  form: { backgroundColor: colors.card, borderRadius: 14, padding: 16, gap: 10, borderWidth: 1, borderColor: colors.border },
  formTitle: { color: colors.navy, fontWeight: "700", fontSize: 16 },
  formBtns: { flexDirection: "row", gap: 10 },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 46,
    color: colors.text,
  },
  btn: {
    flex: 1,
    backgroundColor: colors.blue,
    borderRadius: 8,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
  },
  btnGhost: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: colors.white, fontWeight: "600" },
  hint: { color: colors.muted, fontSize: 12, textAlign: "center" },
  container: { flex: 1, backgroundColor: colors.surface },
});
