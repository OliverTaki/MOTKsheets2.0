import React, { useState, useRef, useEffect } from 'react';
import AdvancedFilterUI from './AdvancedFilterUI.jsx';

export default function FilterManager({ fields, onApplyFilters }) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  // ポップアップの外側をクリックしたら閉じる処理
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [wrapperRef]);
  
  return (
    <div className="relative" ref={wrapperRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 text-sm bg-white border rounded-md shadow-sm flex items-center gap-2 hover:bg-gray-50"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path d="M6 10.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5m-2-3a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5m-2-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5"/>
        </svg>
        Filters
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 z-10 bg-white border rounded-lg shadow-xl">
          <AdvancedFilterUI fields={fields} onApplyFilters={onApplyFilters} />
        </div>
      )}
    </div>
  );
}
