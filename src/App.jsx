import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthProvider } from './AuthContext.jsx';
import useSheetsData from './hooks/useSheetsData.js';
import usePagesData from './hooks/usePagesData.js';
import ShotTable from './components/ShotTable.jsx';
import LoginButton from './components/LoginButton.jsx';
import Toolbar from './components/Toolbar.jsx';

function MainApp() {
  const { page_id } = useParams();
  const navigate = useNavigate();
  const { shots: initialShots, shotsHeader, fields, loading, error } = useSheetsData();
  const pages = usePagesData();
  const [shots, setShots] = useState([]);
  const [sort, setSort] = useState({ key: 'shot_code', asc: true });
  const [filterRules, setFilterRules] = useState([]);

  useEffect(() => {
    if (initialShots.length > 0) setShots(initialShots);
  }, [initialShots]);

  useEffect(() => {
    if (pages.length > 0) {
      const currentPage = pages.find(p => p.page_id === page_id);
      if (currentPage) {
        setFilterRules(currentPage.settings.filters || []);
        setSort(currentPage.settings.sort || { key: 'shot_code', asc: true });
      } else if (!page_id) {
        setFilterRules([]);
        setSort({ key: 'shot_code', asc: true });
      }
    }
  }, [page_id, pages]);

  const handleSort = (fieldId) => {
    setSort(prev => ({ key: fieldId, asc: prev.key === fieldId ? !prev.asc : true }));
    navigate('/');
  };

  const handleFilter = (newRules) => {
    setFilterRules(newRules);
    navigate('/');
  };

  const view = useMemo(() => {
    let filteredRows = [...shots];
    filterRules.forEach(rule => {
      if (!rule.field_id || !rule.value) return;
      filteredRows = filteredRows.filter(row => {
        const rowValue = String(row[rule.field_id] || '').toLowerCase();
        const filterValue = String(rule.value).toLowerCase();
        switch (rule.operator) {
          case 'is': return rowValue === filterValue;
          case 'is not': return rowValue !== filterValue;
          case 'contains': return rowValue.includes(filterValue);
          case 'does not contain': return !rowValue.includes(filterValue);
          default: return true;
        }
      });
    });
    return filteredRows.sort((a, b) => {
      const valA = a[sort.key] ?? '';
      const valB = b[sort.key] ?? '';
      const comparison = String(valA).localeCompare(String(valB), undefined, { numeric: true });
      return sort.asc ? comparison : -comparison;
    });
  }, [shots, sort, filterRules]);

  if (loading) return <div className="p-8 text-center text-gemini-text-secondary">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-400"><h2 className="text-xl font-bold mb-4">Error</h2><p>{error}</p><p className="mt-2 text-sm text-gray-500">Please check .env, Sheet names, & permissions.</p></div>;

  return (
    // ★★★★★ UI修正：左寄せレイアウトに変更 ★★★★★
    <div className="min-h-screen p-4 font-sans">
      <div className="w-full space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold">MOTKsheets 2.0</h1>
          <LoginButton />
        </div>
        <Toolbar fields={fields} onApplyFilters={handleFilter} currentFilters={filterRules} currentSort={sort} />
        <ShotTable
          shots={view}
          shotsHeader={shotsHeader}
          fields={fields.filter(f => f.type !== 'uuid')}
          sortKey={sort.key}
          ascending={sort.asc}
          onSort={handleSort}
          onCellSave={(shotId, field, value) => {
            setShots(currentShots =>
              currentShots.map(shot => shot.shot_id === shotId ? { ...shot, [field]: value } : shot)
            );
          }}
        />
      </div>
    </div>
  );
}

export default function App() {
  return (<AuthProvider><MainApp /></AuthProvider>);
}
