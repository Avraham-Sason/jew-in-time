import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { NavBar } from "@/components/NavBar";
import { MITZVOT } from "@/data/mitzvot";
import { customToMitzvah } from "@/data/customMitzvotAdapter";
import { useCustomMitzvotStore } from "@/stores/useCustomMitzvotStore";
import { useMitzvotStore } from "@/stores/useMitzvotStore";
import { useTheme } from "@/theme/ThemeProvider";
import { typography } from "@/theme/typography";
import { useI18n } from "@/i18n";
import { Mitzvah, MitzvahCategory } from "@/types/mitzvah";

export default function LibraryScreen() {
    const { colors } = useTheme();
    const { language, t } = useI18n();
    const router = useRouter();
    const active = useMitzvotStore((s) => s.activeMitzvot);
    const setEnabled = useMitzvotStore((s) => s.setEnabled);
    const customItems = useCustomMitzvotStore((s) => s.items);
    const [visibility, setVisibility] = useState<"active" | "available">("active");
    const [category, setCategory] = useState<MitzvahCategory | "all">("all");

    const allMitzvot = useMemo<Mitzvah[]>(() => {
        const customs = Object.values(customItems)
            .sort((a, b) => a.createdAt - b.createdAt)
            .map(customToMitzvah);
        return [...MITZVOT, ...customs];
    }, [customItems]);

    const categories = useMemo(() => {
        return ["all", ...Array.from(new Set(allMitzvot.map((item) => item.category)))] as Array<MitzvahCategory | "all">;
    }, [allMitzvot]);

    const items = useMemo(() => {
        return allMitzvot.filter((item) => {
            const enabled = active[item.id]?.enabled ?? false;
            if (visibility === "active" && !enabled) return false;
            if (visibility === "available" && enabled) return false;
            if (category !== "all" && item.category !== category) return false;
            return true;
        });
    }, [allMitzvot, active, category, visibility]);

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={["top"]}>
            <NavBar
                title={t("library.title")}
                subtitle={t("library.subtitle")}
                left={
                    <View style={styles.navActions}>
                        <Pressable
                            onPress={() => router.push("/siddur")}
                            accessibilityRole="button"
                            accessibilityLabel={t("siddur.catalog.open")}
                            style={[styles.siddurBtn, { backgroundColor: `${colors.headerAccent}22` }]}
                        >
                            <Text style={[typography.captionBold, { color: colors.headerAccent }]}>{t("siddur.catalog.title")}</Text>
                        </Pressable>
                        <Pressable
                            onPress={() => router.push("/custom-mitzvah")}
                            accessibilityLabel={t("library.addCustom")}
                            style={[styles.addBtn, { backgroundColor: colors.gold }]}
                        >
                            <Text style={[typography.bodyBold, { color: "#fff" }]}>+</Text>
                        </Pressable>
                    </View>
                }
            />
            <View style={[styles.segmentWrap, { borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
                <Segment
                    label={t("common.active")}
                    selected={visibility === "active"}
                    onPress={() => setVisibility("active")}
                />
                <Segment label={t("common.available")} selected={visibility === "available"} onPress={() => setVisibility("available")} />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsContent} style={styles.pillsScroll}>
                {categories.map((value) => {
                    const selected = value === category;
                    const label = value === "all" ? t("common.all") : t(`library.category.${value}`);
                    return (
                        <Pressable
                            key={value}
                            onPress={() => setCategory(value)}
                            style={[
                                styles.pill,
                                {
                                    backgroundColor: selected ? colors.gold : colors.surface2,
                                },
                            ]}
                        >
                            <Text
                                style={[
                                    typography.small,
                                    { color: selected ? "#fff" : colors.textSub, fontFamily: selected ? "Heebo_700Bold" : "Heebo_400Regular" },
                                ]}
                            >
                                {label}
                            </Text>
                        </Pressable>
                    );
                })}
            </ScrollView>
            <ScrollView style={styles.listScroll} contentContainerStyle={styles.list}>
                {items.map((item) => {
                    const enabled = active[item.id]?.enabled ?? false;
                    const label = language === "en" && item.name.en ? item.name.en : item.name.he;
                    return (
                        <Pressable
                            key={item.id}
                            onPress={() =>
                                item.isCustom
                                    ? router.push({ pathname: "/custom-mitzvah", params: { id: item.id } })
                                    : router.push(`/mitzvah/${item.id}`)
                            }
                            style={[styles.row, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}
                        >
                            <View style={[styles.icon, { backgroundColor: enabled ? colors.goldLight : colors.surface2 }]}>
                                <Text style={{ fontSize: 17, color: enabled ? colors.gold : colors.textMuted }}>✦</Text>
                            </View>
                            <View style={styles.rowMeta}>
                                <Text style={[typography.bodyBold, { color: enabled ? colors.text : colors.textMuted }]}>{label}</Text>
                                <Text style={[typography.small, { color: colors.textMuted, marginTop: 2 }]}>
                                    {t(`library.category.${item.category}`)}
                                </Text>
                            </View>
                            <Pressable
                                accessibilityRole="switch"
                                accessibilityState={{ checked: enabled }}
                                onPress={() => setEnabled(item.id, !enabled)}
                                style={[
                                    styles.toggle,
                                    {
                                        backgroundColor: enabled ? colors.gold : colors.surface2,
                                        borderColor: enabled ? colors.gold : colors.border,
                                    },
                                ]}
                            >
                                {/* Direction-relative, so Yoga resolves it from the real layout direction. The old
                                    version rotated the track by `language` while positioning the thumb by physical
                                    `right`, which RN only swaps by `I18nManager.isRTL` — two sources of truth that
                                    disagree on first launch and render every row inverted. */}
                                <View style={[styles.toggleThumb, enabled ? { end: 2 } : { end: 22 }]} />
                            </Pressable>
                        </Pressable>
                    );
                })}
                {!items.length ? (
                    <Text style={[typography.body, { color: colors.textSub, textAlign: "center", paddingTop: 28 }]}>{t("library.empty")}</Text>
                ) : null}
            </ScrollView>
        </SafeAreaView>
    );
}

function Segment({ label, selected, onPress, style }: { label: string; selected: boolean; onPress: () => void; style?: StyleProp<ViewStyle> }) {
    const { colors } = useTheme();
    return (
        <Pressable
            onPress={onPress}
            style={[
                styles.segment,
                {
                    backgroundColor: selected ? colors.gold : "transparent",
                },
                style,
            ]}
        >
            <Text style={[typography.captionBold, { color: selected ? "#fff" : colors.textMuted }]}>{label}</Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
    },
    segmentWrap: {
        flexDirection: "row",
    },
    segment: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 10,
        paddingVertical: 8,
    },
    pillsScroll: {
        flexGrow: 0,
        flexShrink: 0,
    },
    pillsContent: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        gap: 6,
        alignItems: "center",
    },
    pill: {
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    listScroll: {
        flex: 1,
    },
    list: {
        paddingBottom: 20,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingHorizontal: 18,
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    icon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    rowMeta: {
        flex: 1,
        minWidth: 0,
    },
    toggle: {
        width: 44,
        height: 26,
        borderRadius: 13,
        borderWidth: 1.5,
        justifyContent: "center",
        position: "relative",
    },
    toggleThumb: {
        position: "absolute",
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: "#fff",
    },
    addBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
    },
    navActions: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    siddurBtn: {
        height: 32,
        paddingHorizontal: 12,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
    },
});
