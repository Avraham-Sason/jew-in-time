jest.mock('react-native-mmkv', () => {
  const { createMockMMKV } = require('react-native-mmkv/lib/commonjs/createMMKV.mock');
  return { MMKV: jest.fn(() => createMockMMKV()) };
});

import { chooseGender, chooseNusach, setTaharahTracking } from '../taharahOptIn';
import { useTaharahStore } from '../useTaharahStore';
import { useUserStore } from '../useUserStore';
import { rulesFor } from '@/data/taharahPresets';

const taharah = () => useTaharahStore.getState();
const user = () => useUserStore.getState();

describe('taharahOptIn', () => {
  beforeEach(() => {
    user().reset();
    taharah().reset();
  });

  describe('chooseGender', () => {
    it('stores the gender and flips the taharah role while tracking is on', () => {
      user().setTaharahEnabled(true);

      chooseGender('male');
      expect(user().gender).toBe('male');
      expect(taharah().settings.role).toBe('husband');

      chooseGender('female');
      expect(user().gender).toBe('female');
      expect(taharah().settings.role).toBe('woman');
    });

    it('leaves the taharah store alone while tracking is off', () => {
      taharah().setRole('husband');

      chooseGender('female');

      expect(user().gender).toBe('female');
      expect(taharah().settings.role).toBe('husband');
    });
  });

  describe('setTaharahTracking', () => {
    it('switching on sets the role from the gender and the preset from the nusach', () => {
      user().setGender('male');
      user().setNusach('sefard');

      setTaharahTracking(true);

      expect(user().taharahEnabled).toBe(true);
      expect(taharah().settings.role).toBe('husband');
      expect(taharah().settings.preset).toBe('chassidic');
      expect(taharah().settings.rules).toEqual(rulesFor('chassidic'));
    });

    it('switching on as a woman with the default nusach keeps ashkenaz', () => {
      user().setGender('female');

      setTaharahTracking(true);

      expect(taharah().settings.role).toBe('woman');
      expect(taharah().settings.preset).toBe('ashkenaz');
    });

    it('switching on keeps a preset the user already worked on', () => {
      taharah().setPreset('chabad');
      taharah().addEvent({ type: 'onset', onah: { abs: 740000, kind: 'night' } });
      user().setGender('female');
      user().setNusach('edot_hamizrach');

      setTaharahTracking(true);

      expect(taharah().settings.preset).toBe('chabad');
      expect(taharah().settings.role).toBe('woman');
    });

    it('switching on without a gender only enables the flag', () => {
      user().setNusach('chabad');

      setTaharahTracking(true);

      expect(user().taharahEnabled).toBe(true);
      expect(taharah().settings).toEqual(useTaharahStore.getInitialState().settings);
    });

    it('switching off touches only the user store', () => {
      user().setGender('female');
      setTaharahTracking(true);
      taharah().setRole('husband');

      setTaharahTracking(false);

      expect(user().taharahEnabled).toBe(false);
      expect(taharah().settings.role).toBe('husband');
    });
  });

  describe('chooseNusach', () => {
    it('adopts the matching preset while tracking is on and the store is untouched', () => {
      user().setTaharahEnabled(true);

      chooseNusach('chabad');

      expect(user().nusach).toBe('chabad');
      expect(taharah().settings.preset).toBe('chabad');
      expect(taharah().settings.rules).toEqual(rulesFor('chabad'));
    });

    it('follows a second nusach choice while the store stays untouched', () => {
      user().setTaharahEnabled(true);

      chooseNusach('chabad');
      chooseNusach('edot_hamizrach');

      expect(taharah().settings.preset).toBe('sephardi_ovadia');
    });

    it('keeps the preset once an event is recorded', () => {
      user().setTaharahEnabled(true);
      taharah().addEvent({ type: 'onset', onah: { abs: 740000, kind: 'night' } });

      chooseNusach('chabad');

      expect(user().nusach).toBe('chabad');
      expect(taharah().settings.preset).toBe('ashkenaz');
    });

    it('keeps a hand-edited rule', () => {
      user().setTaharahEnabled(true);
      taharah().setRule('ohrZarua', true);

      chooseNusach('chabad');

      expect(taharah().settings.preset).toBe('ashkenaz');
      expect(taharah().settings.rules.ohrZarua).toBe(true);
    });

    it('leaves the taharah store alone while tracking is off', () => {
      chooseNusach('chabad');

      expect(user().nusach).toBe('chabad');
      expect(taharah().settings.preset).toBe('ashkenaz');
    });
  });
});
