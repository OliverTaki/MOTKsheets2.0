import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdvancedFilterUI from './AdvancedFilterUI.jsx';
import SaveViewControl from './SaveViewControl.jsx';
import usePagesData from '../hooks/usePagesData.js';

export default function Toolbar({ fields, onApplyFilters, currentFilters, currentSort }) {
  const pages = usePagesData();
  const navigate = useNavigate();
  const { page_id } = useParams();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterWrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (filterWrapperRef.current && !filterWrapperRef.current.contains(event.target)) {
        setIsFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [filterWrapperRef]);

  const handlePageChange = (e) => {
    const selectedPageId = e.target.value;
    navigate(selectedPageId ? `/page/${selectedPageId}` : '/');
  };

  const buttonStyle = "px-4 py-2 text-sm bg-gemini-header border border-gemini-border rounded-md shadow-sm flex items-center gap-2 hover:bg-gray-600 transition-colors text-gemini-text focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    // ★★★★★ UI修正：ツールバーを左寄せに変更 ★★★★★
    <div className="flex items-center justify-start gap-3 p-3 bg-gemini-card rounded-lg border border-gemini-border">
      {/* ★★★★★ UI修正：フィルターを一番左に配置 ★★★★★ */}
      <div className="relative" ref={filterWrapperRef}>
        <button onClick={() => setIsFilterOpen(!isFilterOpen)} className={buttonStyle}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M6 10.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5m-2-3a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5m-2-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5"/></svg>
          Filters
        </button>
        {isFilterOpen && (
          // left-0クラスで左端を基準に配置
          <div className="absolute top-full left-0 mt-2 z-10 bg-gemini-card border border-gemini-border rounded-lg shadow-xl">
            <AdvancedFilterUI fields={fields} onApplyFilters={onApplyFilters} initialRules={currentFilters}/>
          </div>
        )}
      </div>

      <select 
        value={page_id || ''}
        onChange={handlePageChange}
        className={buttonStyle}
      >
        <option value="">-- Custom View --</option>
        {pages.map(p => (<option key={p.page_id} value={p.page_id}>{p.title}</option>))}
      </select>
      
      <SaveViewControl currentFilters={currentFilters} currentSort={currentSort} />

    </div>
  );
}
