import { PlatformSettings } from '../models/index.js';
export async function getSettings() {
  return (await PlatformSettings.findOne({ key: 'platform' })) || PlatformSettings.findOneAndUpdate({ key: 'platform' }, { $setOnInsert: { key: 'platform' } }, { upsert: true, new: true });
}
