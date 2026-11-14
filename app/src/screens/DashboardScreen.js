import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Banner, EmptyState } from "../components/UI";
import FailureCard from "../components/FailureCard";
import LoginScreen from "./LoginScreen";
import { useAuth } from "../context/AuthContext";
import api, { errorMessage } from "../api";
import { confirmAction, notify } from "../dialogs";
import { colors, statusStyle } from "../theme";

const FILTERS = ["All", "Pending", "In Progress", "Resolved"];
const REFRESH_MS = 10000;

export default function DashboardScreen() {
  const { isLoggedIn, canResolve, canDelete } = useAuth();
  if (!isLoggedIn) return <LoginScreen />;
  return <Failures canResolve={canResolve} canDelete={canDelete} />;
}

function Failures({ canResolve, canDelete }) {
  const [failures, setFailures] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("All");
  const [busyId, setBusyId] = useState(null);
  const mounted = useRef(true);

  useEffect(() => () => { mounted.current = false; }, []);

  const load = useCallback(async () => {
    try {
      const res = await api.get("/failures");
      const data = Array.isArray(res.data) ? res.data : res.data.failures || [];
      if (!mounted.current) return;
      setFailures(data);
      setError("");
    } catch (e) {
      if (mounted.current) setError(errorMessage(e, "Couldn't load failures"));
    } finally {
      if (mounted.current) setLoaded(true);
    }
  }, []);

  // Fetch when the tab is focused, then poll every 10s while it stays focused
  useFocusEffect(
    useCallback(() => {
      load();
      const id = setInterval(load, REFRESH_MS);
      return () => clearInterval(id);
    }, [load])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const counts = useMemo(() => {
    const c = { All: failures.length, Pending: 0, "In Progress": 0, Resolved: 0 };
    failures.forEach((f) => { if (c[f.status] !== undefined) c[f.status] += 1; });
    return c;
  }, [failures]);

  const visible = filter === "All" ? failures : failures.filter((f) => f.status === filter);

  const update = async (failure, status, resolutionNotes, successMsg) => {
    setBusyId(failure._id);
    try {
      const res = await api.put(`/failures/${failure._id}`, { status, resolutionNotes });
      const updated = res.data.failure || res.data;
      setFailures((list) => list.map((f) => (f._id === failure._id ? updated : f)));
      setError("");
    } catch (e) {
      notify(successMsg.failTitle, errorMessage(e));
    } finally {
      setBusyId(null);
    }
  };

  const onStart = (f) =>
    update(f, "In Progress", "Technician is working on it", { failTitle: "Couldn't start work" });

  const onResolve = async (f) => {
    const ok = await confirmAction({
      title: "Mark as resolved?",
      message: `${f.atmId} will be marked as fixed.`,
      confirmText: "Mark resolved",
    });
    if (ok) update(f, "Resolved", "Fixed by technician", { failTitle: "Couldn't resolve" });
  };

  const onDelete = async (f) => {
    const ok = await confirmAction({
      title: "Delete this record?",
      message: `The report for ${f.atmId} will be removed permanently.`,
      confirmText: "Delete",
      destructive: true,
    });
    if (!ok) return;
    setBusyId(f._id);
    try {
      await api.delete(`/failures/${f._id}`);
      setFailures((list) => list.filter((x) => x._id !== f._id));
    } catch (e) {
      notify("Couldn't delete", errorMessage(e));
    } finally {
      setBusyId(null);
    }
  };

  const header = (
    <View>
      <View style={styles.stats}>
        {["Pending", "In Progress", "Resolved"].map((s) => (
          <View key={s} style={[styles.stat, { backgroundColor: statusStyle[s].bg }]}>
            <Text style={[styles.statNum, { color: statusStyle[s].fg }]}>{counts[s]}</Text>
            <Text style={[styles.statLabel, { color: statusStyle[s].fg }]}>{s}</Text>
          </View>
        ))}
      </View>

      <View style={styles.filters}>
        {FILTERS.map((f) => {
          const active = f === filter;
          return (
            <Pressable
              key={f}
              onPress={() => setFilter(f)}
              style={[styles.filter, active && styles.filterActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.filterText, active && styles.filterTextActive]}>{f}</Text>
            </Pressable>
          );
        })}
      </View>

      <Banner type="error">{error}</Banner>
    </View>
  );

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={styles.content}
      data={visible}
      keyExtractor={(item) => item._id}
      ListHeaderComponent={header}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.ink} />}
      renderItem={({ item }) => (
        <FailureCard
          failure={item}
          canResolve={canResolve}
          canDelete={canDelete}
          busy={busyId === item._id}
          onStart={onStart}
          onResolve={onResolve}
          onDelete={onDelete}
        />
      )}
      ListEmptyComponent={
        loaded ? (
          failures.length === 0 ? (
            <EmptyState title="All ATMs are running" body="No failures have been reported." />
          ) : (
            <EmptyState icon="funnel-outline" title={`No ${filter.toLowerCase()} failures`} body="Try another filter." />
          )
        ) : (
          <EmptyState icon="hourglass-outline" title="Loading failures…" />
        )
      }
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  content: { padding: 16, paddingBottom: 32 },
  stats: { flexDirection: "row", gap: 8, marginBottom: 14 },
  stat: { flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: "center" },
  statNum: { fontSize: 24, fontWeight: "800" },
  statLabel: { fontSize: 12, fontWeight: "600", marginTop: 2 },
  filters: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  filter: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
  },
  filterActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  filterText: { fontSize: 13, color: colors.text },
  filterTextActive: { color: colors.white, fontWeight: "700" },
});
