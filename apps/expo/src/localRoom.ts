import AsyncStorage from '@react-native-async-storage/async-storage';
import { randomUUID } from 'expo-crypto';
import { File, Paths } from 'expo-file-system';
import { isAvailableAsync, shareAsync } from 'expo-sharing';
import type { Room } from './room';

const storageKey = 'aftro.local-room';
export type SavedRoom = Room & { schema: 1; id: string; saved_at: string };

export async function restoreRoom(): Promise<SavedRoom | null> {
  try {
    const raw = await AsyncStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) as SavedRoom : null;
  } catch {
    return null;
  }
}

export async function saveLocalRoom(room: Room, id: string | null): Promise<SavedRoom> {
  const { width, length, height, finish, source } = room;
  const saved: SavedRoom = {
    schema: 1, id: id ?? randomUUID(), saved_at: new Date().toISOString(),
    width, length, height, finish, source,
  };
  await AsyncStorage.setItem(storageKey, JSON.stringify(saved));
  return saved;
}

export async function shareRoomFile(room: SavedRoom) {
  if (!await isAvailableAsync()) throw new Error('Sharing is unavailable');
  const file = new File(Paths.cache, 'aftro-room-' + room.id + '.json');
  file.create({ overwrite: true });
  file.write(JSON.stringify(room, null, 2) + '\n');
  await shareAsync(file.uri, { mimeType: 'application/json', UTI: 'public.json' });
}
