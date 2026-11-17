import { useState } from 'react';

/**
 * Ảnh có dự phòng: nếu URL lỗi, hiển thị khối màu với emoji/chữ cái.
 * Giúp giao diện không vỡ khi ảnh mẫu hoặc ảnh từ API bị hỏng.
 */
export default function ImageWithFallback({ src, alt, fallbackEmoji = '🌿', className = '', ...rest }) {
  const [failed, setFailed] = useState(!src);
  const [loaded, setLoaded] = useState(false);

  if (failed) {
    return (
      <div className={`img-fallback ${className}`} role="img" aria-label={alt}>
        <span aria-hidden="true">{fallbackEmoji}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={`${className} ${loaded ? 'is-loaded' : 'is-loading'}`}
      onLoad={() => setLoaded(true)}
      onError={() => setFailed(true)}
      {...rest}
    />
  );
}
