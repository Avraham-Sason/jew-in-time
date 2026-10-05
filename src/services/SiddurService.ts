import { Platform } from 'react-native';
import { Asset } from 'expo-asset';
import { File } from 'expo-file-system';
import { Nusach } from '@/types/mitzvah';
import { SiddurText, SiddurTextId } from '@/types/siddur';
import { siddurAsset } from '@/data/siddur';

const loaded = new Map<string, Promise<SiddurText>>();

async function readAsset(moduleId: number): Promise<string> {
  const asset = Asset.fromModule(moduleId);
  await asset.downloadAsync();
  const uri = asset.localUri ?? asset.uri;
  if (Platform.OS === 'web') return (await fetch(uri)).text();
  return new File(uri).text();
}

export function loadSiddurText(nusach: Nusach, id: SiddurTextId): Promise<SiddurText> {
  const moduleId = siddurAsset(nusach, id);
  if (moduleId === undefined) return Promise.reject(new Error(`no siddur text ${nusach}/${id}`));
  const key = `${nusach}/${id}`;
  const cached = loaded.get(key);
  if (cached) return cached;
  const pending = readAsset(moduleId).then((raw) => JSON.parse(raw) as SiddurText);
  loaded.set(key, pending);
  pending.catch(() => loaded.delete(key));
  return pending;
}
