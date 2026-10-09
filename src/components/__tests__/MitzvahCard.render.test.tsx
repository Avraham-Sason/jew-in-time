import { fireEvent, screen, userEvent } from '@testing-library/react-native';
import { MitzvahCard } from '../MitzvahCard';
import { IconTile } from '../IconTile';
import { renderWithTheme } from '@/testing/render';
import { THEMES } from '@/theme/colors';
import { useUserStore } from '@/stores/useUserStore';

const BASE = { name: 'תפילין', timeLeft: '2 שעות', pct: 0.8 };

describe('MitzvahCard', () => {
  beforeEach(() => {
    useUserStore.getState().reset();
  });

  it('names the card button by the mitzvah and the time left', () => {
    renderWithTheme(<MitzvahCard {...BASE} onPress={jest.fn()} />);
    expect(screen.getByRole('button', { name: 'תפילין, 2 שעות' })).toBeOnTheScreen();
    expect(screen.getByText('תפילין')).toBeOnTheScreen();
  });

  it('puts the status text into the accessible name between the name and the time left', () => {
    renderWithTheme(<MitzvahCard {...BASE} statusText="עד הנץ" onPress={jest.fn()} />);
    expect(screen.getByRole('button', { name: 'תפילין, עד הנץ, 2 שעות' })).toBeOnTheScreen();
    expect(screen.getByText('עד הנץ')).toBeOnTheScreen();
  });

  it('draws its icon through an IconTile: the given name in the accent tone while open', () => {
    renderWithTheme(<MitzvahCard {...BASE} icon="tefillin" onPress={jest.fn()} />);
    const tile = screen.UNSAFE_getByType(IconTile);
    expect(tile.props.name).toBe('tefillin');
    expect(tile.props.tone).toBe('accent');
  });

  it('falls back to the custom icon when none is given', () => {
    renderWithTheme(<MitzvahCard {...BASE} onPress={jest.fn()} />);
    expect(screen.UNSAFE_getByType(IconTile).props.name).toBe('custom');
  });

  it('shows the time ribbon while open and hides it with hideProgress', () => {
    const { rerender } = renderWithTheme(<MitzvahCard {...BASE} onPress={jest.fn()} />);
    expect(screen.getByText('נותר: 2 שעות')).toBeOnTheScreen();
    rerender(<MitzvahCard {...BASE} hideProgress onPress={jest.fn()} />);
    expect(screen.queryByText('נותר: 2 שעות')).toBeNull();
  });

  describe('open card', () => {
    it('offers the check button named after the mitzvah and fires onComplete once', () => {
      const onComplete = jest.fn();
      renderWithTheme(<MitzvahCard {...BASE} onComplete={onComplete} />);
      fireEvent.press(screen.getByLabelText('סמן תפילין כהושלם'));
      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it('draws no check button without onComplete', () => {
      renderWithTheme(<MitzvahCard {...BASE} onPress={jest.fn()} />);
      expect(screen.queryByLabelText('סמן תפילין כהושלם')).toBeNull();
    });

    it('draws no check button when readOnly and says so', () => {
      renderWithTheme(<MitzvahCard {...BASE} readOnly onComplete={jest.fn()} onPress={jest.fn()} />);
      expect(screen.queryByLabelText('סמן תפילין כהושלם')).toBeNull();
      expect(screen.getByText('תצוגה בלבד')).toBeOnTheScreen();
    });

    it('warns when urgent and has no status text', () => {
      renderWithTheme(<MitzvahCard {...BASE} urgent onPress={jest.fn()} />);
      expect(screen.getByText('⚠ פג בקרוב')).toBeOnTheScreen();
      expect(screen.getByText('⚠ פג בקרוב')).toHaveStyle({ color: THEMES.gold.urgent });
    });

    it('lets the status text replace the urgent warning, in the tone it names', () => {
      renderWithTheme(<MitzvahCard {...BASE} urgent statusText="עד חצות" statusTone="safe" onPress={jest.fn()} />);
      expect(screen.queryByText('⚠ פג בקרוב')).toBeNull();
      expect(screen.getByText('עד חצות')).toHaveStyle({ color: THEMES.gold.safe });
    });

    it('draws the check button with the urgent border while urgent', () => {
      renderWithTheme(<MitzvahCard {...BASE} urgent onComplete={jest.fn()} />);
      expect(screen.getByLabelText('סמן תפילין כהושלם')).toHaveStyle({
        borderColor: THEMES.gold.urgent,
      });
    });
  });

  describe('done card', () => {
    it('hides the check button, the status text and the ribbon, and says it is done', () => {
      renderWithTheme(<MitzvahCard {...BASE} done statusText="עד הנץ" onComplete={jest.fn()} onPress={jest.fn()} />);
      expect(screen.queryByLabelText('סמן תפילין כהושלם')).toBeNull();
      expect(screen.queryByText('עד הנץ')).toBeNull();
      expect(screen.queryByText('נותר: 2 שעות')).toBeNull();
      expect(screen.getByText('✓ בוצע')).toBeOnTheScreen();
    });

    it('swaps the time left for the completed state in the accessible name', () => {
      renderWithTheme(<MitzvahCard {...BASE} done onPress={jest.fn()} />);
      expect(screen.getByRole('button', { name: 'תפילין, בוצע' })).toBeOnTheScreen();
    });

    it('draws the icon tile in the done tone and strikes the name through', () => {
      renderWithTheme(<MitzvahCard {...BASE} icon="shacharit" done onPress={jest.fn()} />);
      expect(screen.UNSAFE_getByType(IconTile).props.tone).toBe('done');
      expect(screen.getByText('תפילין')).toHaveStyle({ textDecorationLine: 'line-through' });
    });

    it('dims the card and paints it on the surface2 fill', () => {
      renderWithTheme(<MitzvahCard {...BASE} done onPress={jest.fn()} />);
      expect(screen.getByRole('button', { name: 'תפילין, בוצע' })).toHaveStyle({
        opacity: 0.55,
        backgroundColor: THEMES.gold.surface2,
      });
    });
  });

  describe('open-text button', () => {
    it('appears only when onOpenText is passed and fires it once', () => {
      const onOpenText = jest.fn();
      const { rerender } = renderWithTheme(<MitzvahCard {...BASE} onPress={jest.fn()} />);
      expect(screen.queryByLabelText('פתח נוסח')).toBeNull();
      rerender(<MitzvahCard {...BASE} onPress={jest.fn()} onOpenText={onOpenText} />);
      fireEvent.press(screen.getByLabelText('פתח נוסח'));
      expect(onOpenText).toHaveBeenCalledTimes(1);
    });

    it('stays on a done card', () => {
      renderWithTheme(<MitzvahCard {...BASE} done onOpenText={jest.fn()} />);
      expect(screen.getByLabelText('פתח נוסח')).toBeOnTheScreen();
    });
  });

  describe('card taps', () => {
    it('fires onPress once from the card', async () => {
      const onPress = jest.fn();
      renderWithTheme(<MitzvahCard {...BASE} onPress={onPress} />);
      await userEvent.setup().press(screen.getByRole('button', { name: 'תפילין, 2 שעות' }));
      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('fires onLongPress once from a long press on the card', async () => {
      const onLongPress = jest.fn();
      renderWithTheme(<MitzvahCard {...BASE} onPress={jest.fn()} onLongPress={onLongPress} />);
      await userEvent.setup().longPress(screen.getByRole('button', { name: 'תפילין, 2 שעות' }));
      expect(onLongPress).toHaveBeenCalledTimes(1);
    });

    it('fires onLongPress from a real long press on the check button too, and does not complete', async () => {
      const onLongPress = jest.fn();
      const onComplete = jest.fn();
      renderWithTheme(<MitzvahCard {...BASE} onComplete={onComplete} onLongPress={onLongPress} />);
      // userEvent drives the nested Pressable's own responder; fireEvent would find the card's handler on an ancestor.
      await userEvent.setup().longPress(screen.getByLabelText('סמן תפילין כהושלם'));
      expect(onLongPress).toHaveBeenCalledTimes(1);
      expect(onComplete).not.toHaveBeenCalled();
    });
  });

  describe('long-press accessibility action', () => {
    it('exposes one longpress action labelled home.quick.title when onLongPress is passed', () => {
      renderWithTheme(<MitzvahCard {...BASE} onPress={jest.fn()} onLongPress={jest.fn()} />);
      expect(screen.getByRole('button', { name: 'תפילין, 2 שעות' }).props.accessibilityActions).toEqual([
        { name: 'longpress', label: 'פעולות מהירות' },
      ]);
    });

    it('calls onLongPress once when a screen reader invokes the action', () => {
      const onLongPress = jest.fn();
      renderWithTheme(<MitzvahCard {...BASE} onPress={jest.fn()} onLongPress={onLongPress} />);
      fireEvent(screen.getByRole('button', { name: 'תפילין, 2 שעות' }), 'accessibilityAction', {
        nativeEvent: { actionName: 'longpress' },
      });
      expect(onLongPress).toHaveBeenCalledTimes(1);
    });

    it('exposes no action without onLongPress', () => {
      renderWithTheme(<MitzvahCard {...BASE} onPress={jest.fn()} />);
      expect(screen.getByRole('button', { name: 'תפילין, 2 שעות' }).props.accessibilityActions).toBeUndefined();
    });
  });

  describe('disabled outer button', () => {
    it('is disabled when nothing on the card responds', () => {
      renderWithTheme(<MitzvahCard {...BASE} />);
      expect(screen.getByRole('button', { name: 'תפילין, 2 שעות' })).toBeDisabled();
    });

    it.each([
      ['onPress', { onPress: jest.fn() }],
      ['onLongPress', { onLongPress: jest.fn() }],
      ['onComplete', { onComplete: jest.fn() }],
      ['onOpenText', { onOpenText: jest.fn() }],
    ])('stays enabled when only %s is passed', (_label, handlers) => {
      renderWithTheme(<MitzvahCard {...BASE} {...handlers} />);
      expect(screen.getByRole('button', { name: 'תפילין, 2 שעות' })).toBeEnabled();
    });

    it('is disabled for a read-only card that has only an onComplete', () => {
      renderWithTheme(<MitzvahCard {...BASE} readOnly onComplete={jest.fn()} />);
      expect(screen.getByRole('button', { name: 'תפילין, 2 שעות' })).toBeDisabled();
    });
  });

  it('shows the stamp only while stamping', () => {
    const { rerender } = renderWithTheme(<MitzvahCard {...BASE} onPress={jest.fn()} />);
    expect(screen.queryByText('נעשה!')).toBeNull();
    rerender(<MitzvahCard {...BASE} stamping onPress={jest.fn()} />);
    expect(screen.getByText('נעשה!')).toBeOnTheScreen();
  });

  it('speaks English when the language is English', () => {
    useUserStore.setState({ language: 'en' });
    renderWithTheme(<MitzvahCard name="Tefillin" timeLeft="2 hours" pct={0.8} onComplete={jest.fn()} />);
    expect(screen.getByRole('button', { name: 'Tefillin, 2 hours' })).toBeOnTheScreen();
    expect(screen.getByLabelText('Mark Tefillin as done')).toBeOnTheScreen();
  });
});
