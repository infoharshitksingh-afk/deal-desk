import { handle, send, readBody } from './_lib/auth.js';
import { saveKeys, saveSettings, keyStatus, getSettings } from './_lib/keys.js';

export default handle(async (req, res) => {
  if (req.method === 'POST') {
    const b = await readBody(req);
    if (b.keys) await saveKeys(b.keys);
    if (b.settings) await saveSettings(b.settings);
  }
  send(res, 200, { keys: await keyStatus(), settings: await getSettings() });
});
