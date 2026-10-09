import { render, screen } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { ThemeProvider } from '@/theme/ThemeProvider';

type HostProps = { props: { accessible?: boolean; onPress?: unknown } };

export function renderWithTheme(ui: ReactElement) {
  return render(ui, { wrapper: ThemeProvider });
}

// The full-screen Pressable behind a dialog or sheet: the one non-accessible node that takes a press.
export function findBackdrop() {
  const [backdrop] = screen.UNSAFE_root.findAll(
    (node: HostProps) => node.props.accessible === false && typeof node.props.onPress === 'function',
  );
  return backdrop;
}
