import { useMemo } from 'react';

/**
 * Ảnh QR MINH HỌA (không quét được) sinh từ chuỗi mã.
 * Khi cần QR thật: `npm i qrcode.react` rồi thay bằng <QRCodeSVG value={url} />.
 */
export default function QRCodePreview({ value, size = 180 }) {
  const cells = useMemo(() => {
    const n = 21;
    let seed = [...value].reduce((acc, c) => acc * 31 + c.charCodeAt(0), 7) >>> 0;
    const rand = () => ((seed = (seed * 1103515245 + 12345) >>> 0) / 2 ** 32);
    const inFinder = (x, y) =>
      (x < 7 && y < 7) || (x > n - 8 && y < 7) || (x < 7 && y > n - 8);
    const grid = [];
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        if (!inFinder(x, y) && rand() > 0.52) grid.push([x, y]);
      }
    }
    return { n, grid };
  }, [value]);

  const finder = (x, y) => (
    <g key={`f-${x}-${y}`}>
      <rect x={x} y={y} width="7" height="7" fill="#1E4331" />
      <rect x={x + 1} y={y + 1} width="5" height="5" fill="#fff" />
      <rect x={x + 2} y={y + 2} width="3" height="3" fill="#1E4331" />
    </g>
  );

  return (
    <svg width={size} height={size} viewBox={`-1 -1 ${cells.n + 2} ${cells.n + 2}`} role="img" aria-label={`Mã QR ${value}`}>
      <rect x="-1" y="-1" width={cells.n + 2} height={cells.n + 2} fill="#fff" />
      {cells.grid.map(([x, y]) => <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="#1E4331" />)}
      {finder(0, 0)}
      {finder(cells.n - 7, 0)}
      {finder(0, cells.n - 7)}
    </svg>
  );
}
