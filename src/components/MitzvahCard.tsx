import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '@/theme/ThemeProvider';
import { shadowPresets, shadowStyle } from '@/theme/shadowStyle';
import { typography } from '@/theme/typography';
import { durations } from '@/theme/tokens';
import { TimeRibbon } from './TimeRibbon';
import { useI18n } from '@/i18n';

type Props = {
  name: string;
  timeLeft: string;
  pct: number;
  urgent?: boolean;
  done?: boolean;
  stamping?: boolean;
  onComplete?: () => void;
  onLongPress?: () => void;
  onPress?: () => void;
};

function Checkmark({ color = '#fff', size = 13, width = 1.8 }: { color?: string; size?: number; width?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 13 13" fill="none">
      <Path d="M2 6.5L5 9.5L11 3.5" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function MitzvahCard({ name, timeLeft, pct, urgent, done, stamping, onComplete, onLongPress, onPress }: Props) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const bg = done ? colors.surface2 : urgent ? colors.urgentBg : colors.surface;
  const bdr = done ? colors.border : urgent ? colors.urgentBorder : colors.border;

  const stampOpacity = useSharedValue(0);
  const stampScale = useSharedValue(2.8);
  const stampRotate = useSharedValue(-18);

  useEffect(() => {
    if (stamping) {
      stampOpacity.value = 0;
      stampScale.value = 2.8;
      stampRotate.value = -18;
      stampOpacity.value = withSequence(
        withTiming(1, { duration: durations.stamp * 0.2 }),
        withDelay(durations.stamp * 0.5, withTiming(0, { duration: durations.stamp * 0.3 })),
      );
      stampScale.value = withSequence(
        withTiming(1.06, { duration: durations.stamp * 0.2 }),
        withTiming(1, { duration: durations.stamp * 0.52 }),
        withTiming(0.96, { duration: durations.stamp * 0.28 }),
      );
      stampRotate.value = withTiming(-12, { duration: durations.stamp * 0.2 });
    }
  }, [stamping, stampOpacity, stampScale, stampRotate]);

  const stampStyle = useAnimatedStyle(() => ({
    opacity: stampOpacity.value,
    transform: [{ scale: stampScale.value }, { rotate: `${stampRotate.value}deg` }],
  }));

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={!onPress && !onLongPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: bg,
          borderColor: bdr,
          opacity: done ? 0.55 : pressed && onPress ? 0.85 : 1,
        },
        shadowStyle(colors.shadow, shadowPresets.card),
      ]}
    >
      <View style={styles.row}>
        <View style={[styles.icon, { backgroundColor: done ? colors.surface2 : colors.goldLight }]}>
          <Text style={{ fontSize: 17, color: done ? colors.textMuted : colors.gold }}>✦</Text>
        </View>
        <View style={styles.meta}>
          <Text
            style={[
              typography.bodyBold,
              {
                color: done ? colors.textSub : colors.text,
                textDecorationLine: done ? 'line-through' : 'none',
              },
            ]}
            numberOfLines={1}
          >
            {name}
          </Text>
          {urgent && !done && (
            <Text style={[typography.micro, { color: colors.urgent, fontWeight: '600', marginTop: 2 }]}>⚠ {t('state.urgentSoon')}</Text>
          )}
          {done && (
            <Text style={[typography.micro, { color: colors.safe, fontWeight: '600', marginTop: 2 }]}>✓ {t('state.completed')}</Text>
          )}
        </View>
        {!done ? (
          <Pressable
            onPress={onComplete}
            onLongPress={onLongPress}
            accessibilityRole="button"
            accessibilityLabel={t('state.completeAction', { name })}
            hitSlop={8}
            style={[
              styles.checkBtn,
              { borderColor: urgent ? colors.urgent : colors.border },
            ]}
          >
            <Checkmark color={urgent ? colors.urgent : colors.textMuted} />
          </Pressable>
        ) : (
          <View style={[styles.checkBtn, { backgroundColor: colors.gold, borderColor: colors.gold }]}>
            <Checkmark color="#fff" />
          </View>
        )}
      </View>
      {!done && <TimeRibbon pct={pct} timeLeft={timeLeft} />}
      {stamping && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <View style={[styles.stampOverlay, { backgroundColor: bg + 'BB' }]}>
            <Animated.View
              style={[
                styles.stamp,
                {
                  borderColor: colors.gold,
                },
                shadowStyle(colors.goldLight, shadowPresets.glow),
                stampStyle,
              ]}
            >
              <Text style={[styles.stampText, { color: colors.gold }]}>{t('state.stamped')}</Text>
            </Animated.View>
          </View>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
    overflow: 'hidden',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  icon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: { flex: 1, minWidth: 0 },
  checkBtn: {
    width: 30,
    height: 30,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stampOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stamp: {
    borderWidth: 3,
    paddingVertical: 5,
    paddingHorizontal: 18,
    borderRadius: 6,
  },
  stampText: {
    fontSize: 21,
    fontWeight: '900',
    letterSpacing: 3,
  },
});
