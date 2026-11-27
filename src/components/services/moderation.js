// Shikoyat va bloklash: server so'rovlari + bloklanganlar ro'yxati (ro'yxatlardan ularning e'lonlari yashiriladi)
const KEY = 'zumo_blocked';
const read = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } };
const write = (ids) => { try { localStorage.setItem(KEY, JSON.stringify(ids)); } catch { /* private mode */ } };

export const openSafety = (target) => window.dispatchEvent(new CustomEvent('zumo:safety', { detail: target }));

const idOf = (v) => String((v && typeof v === 'object' ? v._id : v) || '');

export function installBlockFilter(api) {
  api.interceptors.response.use((res) => {
    const url = String(res.config?.url || '');
    if (!/^\/?(equipment|posts|service-providers|services|locations|chat\/conversations)\/?(\?|$)/.test(url)) return res;
    const blocked = new Set(read());
    if (!blocked.size) return res;
    const chat = url.includes('chat/');
    const clean = (list) => list.filter((i) => !blocked.has(idOf(i?.userId ?? i?.userid ?? (chat ? i?.partnerId : ''))));
    if (Array.isArray(res.data)) res.data = clean(res.data);
    else if (res.data) {
      for (const k of ['items', 'data', 'providers', 'posts', 'conversations']) {
        if (Array.isArray(res.data[k])) res.data[k] = clean(res.data[k]);
      }
    }
    return res;
  });
}

export const sendReport = (api, body) => api.post('/moderation/report', body);

export async function fetchBlocks(api) {
  const { data } = await api.get('/moderation/blocks');
  write(data.map((u) => u._id));
  return data;
}
export async function blockUser(api, id) {
  await api.post(`/moderation/blocks/${id}`);
  write([...new Set([...read(), String(id)])]);
}
export async function unblockUser(api, id) {
  await api.delete(`/moderation/blocks/${id}`);
  write(read().filter((x) => x !== String(id)));
}

// Import qilingan egalar ismi bazada "Sotuvchi ••1234" — ru/en da joriy tilga o'giriladi
export function installSellerNames(api, translate) {
  const fix = (u) => { if (u && typeof u.fullName === 'string' && u.fullName.startsWith('Sotuvchi ••')) u.fullName = u.fullName.replace('Sotuvchi', translate('Sotuvchi')); };
  api.interceptors.response.use((res) => {
    for (const item of [].concat(res.data?.items || res.data || [])) { fix(item); fix(item?.userId); }
    return res;
  });
}
