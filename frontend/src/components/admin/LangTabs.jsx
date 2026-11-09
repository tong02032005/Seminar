/** Thanh tab ngôn ngữ cho form admin (Tiếng Việt / English / 中文). marks: {lang: nội dung nhãn phụ} */
export default function LangTabs({ languages, active, onChange, defaultLang, marks = {} }) {
  return (
    <div className="lang-tabs" role="tablist">
      {languages.map((l) => (
        <button
          key={l.code}
          type="button"
          role="tab"
          aria-selected={active === l.code}
          className={`lang-tabs__tab ${active === l.code ? 'is-active' : ''}`}
          onClick={() => onChange(l.code)}
        >
          {l.name}
          {l.code === defaultLang && <small> (mặc định)</small>}
          {!l.is_active && <small> (đang tắt)</small>}
          {marks[l.code]}
        </button>
      ))}
    </div>
  );
}
