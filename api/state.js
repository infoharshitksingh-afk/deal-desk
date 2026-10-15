import { handle, send } from './_lib/auth.js';
import { listAccounts, listRegistry, withScore } from './_lib/pipeline.js';
import { keyStatus, getSettings } from './_lib/keys.js';
import { getLog, backend, persistent } from './_lib/store.js';
import { ICP, FORMATS, PERSONAS } from './_lib/icp.js';

export default handle(async (req, res) => {
  const [accounts, registry, keys, settings, log] = await Promise.all([listAccounts(), listRegistry(), keyStatus(), getSettings(), getLog(80)]);
  send(res, 200, {
    accounts: Object.entries(accounts).map(([id, a]) => ({ id, ...withScore(a) })),
    registry: Object.entries(registry).map(([key, r]) => ({ key, ...r })),
    keys, settings, log,
    storage: { backend: backend(), persistent: persistent() },
    model: { ICP, FORMATS, PERSONAS }
  });
});
