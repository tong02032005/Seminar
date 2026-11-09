import { useEffect, useState } from 'react';
import { Languages, Wand2, Save, Trash2 } from 'lucide-react';
import Modal from '../common/Modal';
import FormField from '../common/FormField';
import LangTabs from './LangTabs';
import { mediaUrl } from '../../services/config';
import {
  createPoi, updatePoi, getPoiAdmin, translateNarration,
  createAudioPreview, getAudioPreview, saveAudio, deleteAudio,
} from '../../services/api';

const EMPTY = { animal_id: '', icon: '', latitude: '', longitude: '' };
const blankContent = () => ({ name: '', direction: '', narration: '', narration_source: 'manual', audio_file: null });

function toContents(poi, languages) {
  const map = Object.fromEntries(languages.map((l) => [l.code, blankContent()]));
  for (const c of poi.contents) {
    map[c.lang] = { name: c.name, direction: c.direction ?? '', narration: c.narration ?? '', narration_source: c.narration_source, audio_file: c.audio_file };
  }
  return map;
}

/**
 * UC08 – thêm/sửa POI và thuyết minh.
 * Âm thanh chỉ tạo từ lời thuyết minh ĐÃ LƯU: Tạo âm thanh → nghe thử bản nháp → Lưu âm thanh.
 */
export default function PoiFormModal({ open, poiId, animals, languages, defaultLang, onSaved, onClose }) {
  const [id, setId] = useState(poiId);
  const [form, setForm] = useState(EMPTY);
  const [contents, setContents] = useState({});
  const [saved, setSaved] = useState({}); // nội dung đang lưu ở server, để biết tab nào đã sửa
  const [tab, setTab] = useState(defaultLang);
  const [drafts, setDrafts] = useState({}); // {lang: {draftId, url}}
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(''); // '' | 'load' | 'save' | 'translate' | 'audio'
  const [message, setMessage] = useState(null); // {type: 'error'|'ok', text}

  const clearDrafts = () => setDrafts((d) => { Object.values(d).forEach((x) => URL.revokeObjectURL(x.url)); return {}; });

  const applyPoi = (poi) => {
    setForm({ animal_id: poi.animal_id, icon: poi.icon ?? '', latitude: poi.latitude, longitude: poi.longitude });
    const map = toContents(poi, languages);
    setContents(map);
    setSaved(map);
  };

  useEffect(() => {
    if (!open) return;
    setId(poiId); setErrors({}); setMessage(null); setTab(defaultLang); clearDrafts();
    if (!poiId) {
      const blank = Object.fromEntries(languages.map((l) => [l.code, blankContent()]));
      setForm(EMPTY); setContents(blank); setSaved(blank);
      return;
    }
    setBusy('load');
    getPoiAdmin(poiId).then(applyPoi).catch((err) => setMessage({ type: 'error', text: err.message })).finally(() => setBusy(''));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, poiId]);

  const current = contents[tab] ?? blankContent();
  const anyDirty = languages.some((l) => ['name', 'direction', 'narration'].some((k) => (contents[l.code]?.[k] ?? '') !== (saved[l.code]?.[k] ?? '')));
  const narrationDirty = (lang) => (contents[lang]?.narration ?? '') !== (saved[lang]?.narration ?? '');

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const setText = (key) => (e) => setContents((c) => ({
    ...c,
    [tab]: { ...c[tab], [key]: e.target.value, ...(key === 'narration' ? { narration_source: 'manual' } : {}) },
  }));

  const pickAnimal = (e) => {
    const animalId = e.target.value;
    setForm((f) => ({ ...f, animal_id: animalId }));
    const animal = animals.find((a) => String(a.id) === animalId);
    if (animal && !contents[defaultLang]?.name) {
      setContents((c) => ({ ...c, [defaultLang]: { ...c[defaultLang], name: animal.name } }));
    }
  };

  /** Nút Dịch: dịch lời của tab hiện tại sang các ngôn ngữ còn lại (chưa lưu) */
  const translate = async () => {
    if (!current.narration.trim()) { setMessage({ type: 'error', text: 'Lời thuyết minh đang trống.' }); return; }
    setBusy('translate'); setMessage(null);
    try {
      const { translations } = await translateNarration(current.narration, tab);
      const manual = Object.keys(translations).filter((l) => contents[l]?.narration_source === 'manual' && contents[l]?.narration.trim());
      const names = manual.map((l) => languages.find((x) => x.code === l)?.name ?? l).join(', ');
      const overwrite = !manual.length || window.confirm(`Lời ${names} do bạn tự viết. Ghi đè bằng bản dịch?`);
      setContents((c) => {
        const next = { ...c };
        for (const [lang, text] of Object.entries(translations)) {
          if (!next[lang] || (manual.includes(lang) && !overwrite)) continue;
          next[lang] = { ...next[lang], narration: text, narration_source: 'auto' };
        }
        return next;
      });
      setMessage({ type: 'ok', text: 'Đã dịch. Kiểm tra lại từng tab rồi bấm Lưu POI.' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setBusy('');
    }
  };

  /** Kiểm tra rồi lưu POI (thêm hoặc sửa). Trả về POI đã lưu, hoặc null nếu dữ liệu sai / người dùng hủy / lỗi. */
  const persist = async () => {
    const errs = {};
    if (!id && !form.animal_id) errs.animal_id = 'Chọn động vật.';
    const lat = Number(form.latitude); const lng = Number(form.longitude);
    if (form.latitude === '' || !(lat >= -90 && lat <= 90)) errs.latitude = 'Vĩ độ từ -90 đến 90.';
    if (form.longitude === '' || !(lng >= -180 && lng <= 180)) errs.longitude = 'Kinh độ từ -180 đến 180.';
    if (!contents[defaultLang]?.name.trim()) { errs.name = 'Nhập tên POI bằng ngôn ngữ mặc định.'; setTab(defaultLang); }
    setErrors(errs);
    if (Object.keys(errs).length) {
      setMessage({ type: 'error', text: 'Thông tin POI chưa hợp lệ, hãy kiểm tra các ô báo đỏ.' });
      return null;
    }

    const losing = languages.filter((l) => saved[l.code]?.audio_file && narrationDirty(l.code));
    if (losing.length && !window.confirm('Sửa lời sẽ xóa file âm thanh hiện tại, tiếp tục?')) return null;

    // Ngôn ngữ chưa có tên nhưng đã có lời (vd vừa bấm Dịch) thì lấy tên ở ngôn ngữ mặc định
    const fallbackName = contents[defaultLang].name.trim();
    const body = {
      icon: form.icon.trim() || null,
      latitude: lat,
      longitude: lng,
      contents: Object.entries(contents)
        .filter(([, c]) => c.name.trim() || c.narration.trim())
        .map(([lang, c]) => ({
          lang, name: c.name.trim() || fallbackName, direction: c.direction.trim() || null,
          narration: c.narration.trim() || null, narration_source: c.narration_source,
        })),
    };
    try {
      const poi = id ? await updatePoi(id, body) : await createPoi({ ...body, animal_id: Number(form.animal_id) });
      const isNew = !id;
      setId(poi.id);
      applyPoi(poi);
      setDrafts((d) => {
        const keep = { ...d };
        for (const l of losing) { URL.revokeObjectURL(keep[l.code]?.url); delete keep[l.code]; }
        return keep;
      });
      onSaved(poi, isNew);
      return poi;
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
      return null;
    }
  };

  const save = async (e) => {
    e.preventDefault();
    setBusy('save'); setMessage(null);
    const poi = await persist();
    if (poi) setMessage({ type: 'ok', text: 'Đã lưu POI.' });
    setBusy('');
  };

  /**
   * Tạo bản nháp mp3 rồi phát thử ngay trong form. Lời chưa lưu thì tự lưu POI trước
   * (backend chỉ đọc lời đã lưu). langs: các ngôn ngữ cần tạo.
   */
  const generate = async (langs) => {
    setBusy('audio'); setMessage(null);
    try {
      let poiId = id;
      if (!id || anyDirty) {
        const poi = await persist();
        if (!poi) return;
        poiId = poi.id;
      }
      const made = [];
      for (const lang of langs) {
        const { draft_id: draftId } = await createAudioPreview(poiId, lang);
        const blob = await getAudioPreview(poiId, draftId);
        setDrafts((d) => {
          if (d[lang]) URL.revokeObjectURL(d[lang].url);
          return { ...d, [lang]: { draftId, url: URL.createObjectURL(blob) } };
        });
        made.push(languages.find((l) => l.code === lang)?.name ?? lang);
      }
      setMessage({ type: 'ok', text: `Đã tạo bản nghe thử: ${made.join(', ')}. Nghe ở từng tab rồi bấm Lưu âm thanh.` });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setBusy('');
    }
  };

  const runAudio = async (fn, okText) => {
    setBusy('audio'); setMessage(null);
    try {
      const poi = await fn();
      applyPoi(poi);
      setDrafts((d) => { const keep = { ...d }; if (keep[tab]) URL.revokeObjectURL(keep[tab].url); delete keep[tab]; return keep; });
      setMessage({ type: 'ok', text: okText });
      onSaved(poi, false);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setBusy('');
    }
  };

  const savedAudio = saved[tab]?.audio_file;
  const draft = drafts[tab];
  const canGenerate = Boolean(current.narration.trim());
  const langsWithNarration = languages.filter((l) => contents[l.code]?.narration.trim()).map((l) => l.code);
  const status = !saved[tab]?.narration ? 'Chưa có lời thuyết minh'
    : draft ? 'Có bản nghe thử chưa lưu'
      : savedAudio ? 'Đã có âm thanh' : 'Chưa có âm thanh';
  const marks = Object.fromEntries(languages.map((l) => [l.code, saved[l.code]?.audio_file ? ' 🔊' : contents[l.code]?.narration ? ' ✓' : '']));

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={id ? 'Sửa POI & thuyết minh' : 'Thêm POI'}
      footer={
        <>
          <button className="btn btn--ghost" onClick={onClose} disabled={busy === 'save'}>Đóng</button>
          <button className="btn btn--primary" type="submit" form="poi-form" disabled={Boolean(busy)}>
            <Save size={16} /> {busy === 'save' ? 'Đang lưu…' : 'Lưu POI'}
          </button>
        </>
      }
    >
      {busy === 'load' ? <p>Đang tải…</p> : (
        <form id="poi-form" className="form-grid" onSubmit={save} noValidate>
          {message && <p className={`span-2 ${message.type === 'error' ? 'form-error' : 'form-ok'}`} role="status">{message.text}</p>}
          {id ? (
            <FormField label="Động vật" id="p-animal" className="span-2">
              <input id="p-animal" value={animals.find((a) => a.id === Number(form.animal_id))?.name ?? `#${form.animal_id}`} disabled />
            </FormField>
          ) : (
            <FormField label="Động vật (chưa có POI) *" id="p-animal" className="span-2" error={errors.animal_id}>
              <select id="p-animal" value={form.animal_id} onChange={pickAnimal}>
                <option value="">— Chọn động vật —</option>
                {animals.filter((a) => !a.has_poi).map((a) => <option key={a.id} value={a.id}>{a.name} ({a.scientific_name})</option>)}
              </select>
            </FormField>
          )}
          <FormField label="Vĩ độ (latitude) *" id="p-lat" type="number" step="any" value={form.latitude} onChange={set('latitude')} error={errors.latitude} />
          <FormField label="Kinh độ (longitude) *" id="p-lng" type="number" step="any" value={form.longitude} onChange={set('longitude')} error={errors.longitude} />
          <FormField label="Biểu tượng (emoji)" id="p-icon" value={form.icon} onChange={set('icon')} placeholder="🐯" />

          <div className="span-2">
            <LangTabs languages={languages} active={tab} onChange={setTab} defaultLang={defaultLang} marks={marks} />
          </div>
          <FormField label={`Tên POI${tab === defaultLang ? ' *' : ''}`} id="p-name" className="span-2" value={current.name} onChange={setText('name')} error={tab === defaultLang ? errors.name : undefined} />
          <FormField label="Chỉ đường" id="p-dir" as="textarea" rows={2} className="span-2" value={current.direction} onChange={setText('direction')} />
          <FormField
            label="Lời thuyết minh" id="p-narr" as="textarea" rows={6} className="span-2"
            value={current.narration} onChange={setText('narration')}
            hint={current.narration_source === 'auto' ? 'Bản dịch tự động – nên đọc lại trước khi tạo âm thanh.' : undefined}
          />
          <div className="span-2 narration-tools">
            <button type="button" className="btn btn--ghost" onClick={translate} disabled={Boolean(busy) || !current.narration.trim()}>
              <Languages size={16} /> {busy === 'translate' ? 'Đang dịch…' : 'Dịch sang ngôn ngữ khác'}
            </button>
          </div>

          <section className="span-2 audio-box">
            <header>
              <strong>Âm thanh thuyết minh</strong>
              <span className={`tag ${savedAudio ? 'tag--ok' : draft ? 'tag--warn' : ''}`}>{status}</span>
            </header>
            {anyDirty && <p className="field__hint">Có nội dung chưa lưu – bấm Tạo âm thanh sẽ tự lưu POI trước.</p>}
            {savedAudio && (
              <div className="audio-box__row">
                <span>Đang dùng:</span>
                <audio controls src={mediaUrl(savedAudio)} />
                <button type="button" className="btn btn--danger btn--sm" disabled={Boolean(busy)}
                  onClick={() => window.confirm('Xóa file âm thanh của ngôn ngữ này?') && runAudio(() => deleteAudio(id, tab), 'Đã xóa âm thanh.')}>
                  <Trash2 size={15} /> Xóa âm thanh
                </button>
              </div>
            )}
            {draft && (
              <div className="audio-box__row">
                <span>Nghe thử:</span>
                <audio controls src={draft.url} />
                <button type="button" className="btn btn--primary btn--sm" disabled={Boolean(busy)}
                  onClick={() => runAudio(() => saveAudio(id, tab, draft.draftId), 'Đã lưu âm thanh – khách đã nghe được.')}>
                  <Save size={15} /> Lưu âm thanh
                </button>
              </div>
            )}
            <div className="btn-row btn-row--start">
              <button type="button" className="btn btn--ghost" onClick={() => generate([tab])} disabled={Boolean(busy) || !canGenerate}>
                <Wand2 size={16} /> {busy === 'audio' ? 'Đang xử lý…' : savedAudio || draft ? 'Tạo lại' : 'Tạo âm thanh'}
              </button>
              {langsWithNarration.length > 1 && (
                <button type="button" className="btn btn--ghost" onClick={() => generate(langsWithNarration)} disabled={Boolean(busy)}>
                  <Wand2 size={16} /> Tạo cho cả {langsWithNarration.length} ngôn ngữ
                </button>
              )}
            </div>
          </section>
        </form>
      )}
    </Modal>
  );
}
