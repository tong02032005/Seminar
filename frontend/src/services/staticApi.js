/**
 * BẢN TĨNH (VITE_STATIC=1): đọc dữ liệu từ file JSON do backend xuất sẵn
 * (python -m app.core.export_static) thay vì gọi API. Chỉ có các API khách xem.
 * Danh sách động vật được tìm/lọc/sắp xếp/phân trang ngay trên trình duyệt, giống backend.
 */
const bundles = new Map(); // mỗi ngôn ngữ một file data/<lang>.json, tải một lần

async function load(lang, key) {
  if (!bundles.has(lang)) {
    bundles.set(lang, fetch(`./data/${lang}.json`).then((res) => {
      if (!res.ok) throw new Error('Không tải được dữ liệu');
      return res.json();
    }));
  }
  const data = (await bundles.get(lang))[key];
  if (data === undefined) throw Object.assign(new Error('Không tìm thấy dữ liệu'), { status: 404 });
  return data;
}

const fold = (s) => (s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase();

function animalPage(all, { q, category_id, zone_id, sort = 'name', page = 1, size = 20 }) {
  const term = fold(q?.trim());
  let items = all.filter((a) => (!term || fold(a.name).includes(term) || fold(a.scientific_name).includes(term))
    && (!category_id || String(a.category_id) === String(category_id))
    && (!zone_id || String(a.zone_id) === String(zone_id)));
  const order = {
    popular: (a, b) => b.popularity - a.popularity || a.id - b.id,
    newest: (a, b) => b.id - a.id,
  }[sort] ?? ((a, b) => a.name.localeCompare(b.name) || a.id - b.id);
  items = [...items].sort(order);
  const p = Number(page); const s = Number(size);
  return { items: items.slice((p - 1) * s, p * s), total: items.length, page: p, size: s };
}

export async function staticGet(path, params = {}) {
  const lang = params.lang || 'default';
  const rel = path.replace(/^\/api\//, '');
  if (rel === 'animals') return animalPage(await load(lang, 'animals'), params);
  if (rel === 'pois') {
    const all = await load(lang, 'pois');
    return params.zone_id ? all.filter((p) => String(p.zone_id) === String(params.zone_id)) : all;
  }
  return load(lang, rel);
}
