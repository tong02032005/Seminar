export const formatNumber = (n) => new Intl.NumberFormat('vi-VN').format(n);

/** "07h00-17h00" → "07:00 – 17:00" */
export const formatHours = (value) => (value ? value.replace(/h/g, ':').replace('-', ' – ') : '');

/** Diện tích m² → "12.000 m²" */
export const formatArea = (m2) => (m2 ? `${formatNumber(m2)} m²` : '');
