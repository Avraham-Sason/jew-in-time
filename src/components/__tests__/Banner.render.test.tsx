import { screen, userEvent } from '@testing-library/react-native';
import { Banner, type BannerTone } from '../Banner';
import { renderWithTheme } from '@/testing/render';
import { THEMES, THEME_NAMES } from '@/theme/colors';
import { useUserStore } from '@/stores/useUserStore';

describe('Banner', () => {
  beforeEach(() => {
    useUserStore.getState().reset();
  });

  it('shows its text and is not a button without onPress', () => {
    renderWithTheme(<Banner text="Heads up" tone="info" />);
    expect(screen.getByText('Heads up')).toBeOnTheScreen();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('becomes a button named by its text when it has onPress, and fires it once per tap', async () => {
    const onPress = jest.fn();
    renderWithTheme(<Banner text="Enable notifications" tone="warning" onPress={onPress} />);
    const button = screen.getByRole('button', { name: 'Enable notifications' });
    await userEvent.setup().press(button);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it.each(THEME_NAMES)('%s: a pressable banner paints its tone border and tint', (name) => {
    useUserStore.setState({ theme: name });
    const colors = THEMES[name];
    renderWithTheme(<Banner text="Late" tone="urgent" onPress={jest.fn()} />);
    const button = screen.getByRole('button', { name: 'Late' });
    expect(button).toHaveStyle({ borderColor: colors.urgent, backgroundColor: colors.urgentBg });
    expect(screen.getByText('Late')).toHaveStyle({ color: colors.urgent });
  });

  it.each<[BannerTone, 'text' | 'textSub' | 'urgent' | 'goldText']>([
    ['warning', 'text'],
    ['safe', 'text'],
    ['info', 'textSub'],
    ['urgent', 'urgent'],
    ['accent', 'goldText'],
  ])('%s: the text reads the %s colour of the current palette', (tone, key) => {
    renderWithTheme(<Banner text="Message" tone={tone} />);
    expect(screen.getByText('Message')).toHaveStyle({ color: THEMES.gold[key] });
  });
});
