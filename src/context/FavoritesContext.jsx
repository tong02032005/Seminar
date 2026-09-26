import { createContext, useCallback, useContext, useMemo } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

const FavoritesContext = createContext(null);

/**
 * Danh sách id động vật yêu thích, lưu ở localStorage.
 * Sau này có thể đồng bộ với API: POST/DELETE /api/users/me/favorites/{id}
 */
export function FavoritesProvider({ children }) {
  const [favoriteIds, setFavoriteIds] = useLocalStorage('zooguide_favorites', []);

  const isFavorite = useCallback((id) => favoriteIds.includes(id), [favoriteIds]);

  /** Trả về true nếu vừa thêm, false nếu vừa bỏ */
  const toggleFavorite = useCallback(
    (id) => {
      const adding = !favoriteIds.includes(id);
      setFavoriteIds((prev) => (adding ? [...prev, id] : prev.filter((x) => x !== id)));
      return adding;
    },
    [favoriteIds, setFavoriteIds]
  );

  const value = useMemo(
    () => ({ favoriteIds, isFavorite, toggleFavorite, clearFavorites: () => setFavoriteIds([]) }),
    [favoriteIds, isFavorite, toggleFavorite, setFavoriteIds]
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export const useFavorites = () => useContext(FavoritesContext);
