import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

// Initial mock data for demonstration
const initialMockPages = [
  {
    page_id: 'default-view-1',
    title: 'All Shots',
    columnWidths: {},
    columnOrder: [],
    filterSettings: {},
    fieldVisibility: [],
    sortOrder: { key: 'shot_id', ascending: true },
  },
  {
    page_id: 'default-view-2',
    title: 'Animation Dept. View',
    columnWidths: { shot_id: 250, status: 120, memo: 400 },
    columnOrder: ['shot_id', 'status', 'memo'],
    filterSettings: { status: ['In Progress', 'Review'] },
    fieldVisibility: ['shot_id', 'status', 'memo'],
    sortOrder: { key: 'status', ascending: false },
  },
];

/**
 * MOCK: A custom hook to manage saved page configurations.
 * This hook simulates fetching, adding, updating, and deleting page data.
 */
const usePagesData = () => {
  const [pages, setPages] = useState(initialMockPages);

  const refreshPages = useCallback(() => {
    // In a real app, this would re-fetch from the backend.
    // For the mock, we just log it.
    console.log('Mock refreshPages called');
  }, []);

  const addPage = useCallback((newPage) => {
    const pageWithId = { ...newPage, page_id: uuidv4() };
    setPages(prev => [...prev, pageWithId]);
    console.log('Mock addPage called, new page:', pageWithId);
    return Promise.resolve(pageWithId);
  }, []);

  const updatePage = useCallback((pageId, updatedPage) => {
    setPages(prev => prev.map(p => (p.page_id === pageId ? { ...p, ...updatedPage } : p)));
    console.log('Mock updatePage called for pageId:', pageId);
    return Promise.resolve(updatedPage);
  }, []);

  const removePage = useCallback((pageId) => {
    setPages(prev => prev.filter(p => p.page_id !== pageId));
    console.log('Mock removePage called for pageId:', pageId);
    return Promise.resolve();
  }, []);


  useEffect(() => {
    refreshPages();
  }, [refreshPages]);

  return { pages, refreshPages, addPage, updatePage, removePage };
};

export default usePagesData;
