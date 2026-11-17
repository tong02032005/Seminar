export const formatNumber = (n) => new Intl.NumberFormat('vi-VN').format(n);

/** "07h00-17h00" → "07:00 – 17:00" */
export const formatHours = (value) => (value ? value.replace(/h/g, ':').replace('-', ' – ') : '');

