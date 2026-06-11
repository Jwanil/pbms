import { useState, useCallback } from 'react';

const useColumnVisibility = (allColumns, defaultHidden = []) => {
  const [hiddenKeys, setHiddenKeys] = useState(new Set(defaultHidden));

  const visibleColumns = allColumns.filter(col => !hiddenKeys.has(col.key));

  const toggleColumn = useCallback((key) => {
    setHiddenKeys(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }, []);

  const isVisible = (key) => !hiddenKeys.has(key);

  return { visibleColumns, toggleColumn, isVisible, hiddenKeys };
};

export default useColumnVisibility;