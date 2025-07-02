import React, { useState, useEffect, useRef } from 'react';
import { PencilIcon } from '@heroicons/react/24/solid';
import { Link } from 'react-router-dom';

const ShotTable = ({ shots, fields, columnWidths, onColumnResize, onCellSave }) => {
    const [resizingFieldId, setResizingFieldId] = useState(null);
    const startCursorX = useRef(0);
    const startColumnWidth = useRef(0);
    
    // 編集中のセルを管理するState
    const [editingCell, setEditingCell] = useState(null); // { shotId, fieldId }
    const [editValue, setEditValue] = useState('');
    const inputRef = useRef(null);

    // 列リサイズのマウスダウンイベント
    const handleColResizeMouseDown = (e, fieldId) => {
        e.preventDefault();
        e.stopPropagation();
        setResizingFieldId(fieldId);
        startCursorX.current = e.clientX;
        startColumnWidth.current = columnWidths[fieldId] || 150;
    };

    // セル編集のクリックイベント
    const handleCellClick = (shotId, fieldId, currentValue) => {
        setEditingCell({ shotId, fieldId });
        setEditValue(currentValue);
    };

    // 編集内容を保存するハンドラ
    const handleSave = () => {
        if (editingCell) {
            onCellSave(editingCell.shotId, editingCell.fieldId, editValue);
            setEditingCell(null);
        }
    };

    // input要素からフォーカスが外れたら保存
    const handleInputBlur = () => {
        handleSave();
    };

    // Enterキーで保存、Escapeキーでキャンセル
    const handleInputKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSave();
        } else if (e.key === 'Escape') {
            setEditingCell(null);
        }
    };
    
    // 編集モードになったらinputにフォーカスを当てる
    useEffect(() => {
        if (editingCell && inputRef.current) {
            inputRef.current.focus();
        }
    }, [editingCell]);


    // 列リサイズのイベントリスナー
    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!resizingFieldId) return;
            e.preventDefault();
            const deltaX = e.clientX - startCursorX.current;
            const newWidth = startColumnWidth.current + deltaX;
            onColumnResize(resizingFieldId, Math.max(60, newWidth));
        };
        const handleMouseUp = () => setResizingFieldId(null);
        if (resizingFieldId) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [resizingFieldId, onColumnResize]);

    return (
        <table className="table-fixed text-sm text-left text-gray-500 dark:text-gray-400 border-collapse">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400 sticky top-0 z-10">
                <tr>
                    {fields.map((field) => {
                        const style = { width: `${columnWidths[field.id] || 150}px` };
                        return (
                            <th key={field.id} scope="col" style={style} className="py-2 px-3 border border-gray-200 dark:border-gray-600 relative select-none">
                                <div className="truncate h-full flex items-center">{field.label}</div>
                                <div className="group absolute top-0 right-[-5px] h-full w-[10px] cursor-col-resize z-20" onMouseDown={(e) => handleColResizeMouseDown(e, field.id)}>
                                    <div className="w-px h-full bg-gray-300 dark:bg-gray-600 group-hover:bg-blue-400 transition-colors mx-auto"></div>
                                </div>
                            </th>
                        );
                    })}
                </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800">
                {shots.map((shot, rowIndex) => (
                    <tr key={shot.shot_id || rowIndex} className="hover:bg-gray-50 dark:hover:bg-gray-600">
                        {fields.map((field) => {
                            const cellValue = shot[field.id];
                            const isEditing = editingCell && editingCell.shotId === shot.shot_id && editingCell.fieldId === field.id;
                            const tdClassName = "py-2 px-3 border border-gray-200 dark:border-gray-600 group relative";

                            return (
                                <td key={field.id} className={tdClassName}>
                                    {isEditing ? (
                                        <input
                                            ref={inputRef}
                                            type="text"
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            onBlur={handleInputBlur}
                                            onKeyDown={handleInputKeyDown}
                                            className="absolute inset-0 w-full h-full bg-blue-100 dark:bg-blue-900 border-2 border-blue-500 outline-none p-2"
                                        />
                                    ) : (
                                        <>
                                            <div className="overflow-hidden whitespace-nowrap">
                                                {field.id === 'thumbnail' ? (
                                                    cellValue && <img src={cellValue.replace("via.placeholder.com", "placehold.co")} alt={`Thumbnail for ${shot.shot_code}`} className="max-h-16 w-auto object-contain" onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/120x68/EFEFEF/AAAAAA?text=Error'; }} />
                                                ) : field.id === 'shot_code' ? (
                                                    <Link to={`/shot/${shot.shot_id}`} className="font-medium text-blue-600 dark:text-blue-500 hover:underline" title={cellValue}>
                                                        {cellValue}
                                                    </Link>
                                                ) : (
                                                    <span title={cellValue}>{cellValue}</span>
                                                )}
                                            </div>
                                            {field.editable === 'TRUE' && (
                                                <PencilIcon
                                                    style={{ width: '11px', height: '11px' }}
                                                    className="absolute top-2 right-2 text-gray-400 opacity-0 group-hover:opacity-100 cursor-pointer"
                                                    onClick={() => handleCellClick(shot.shot_id, field.id, cellValue)}
                                                />
                                            )}
                                        </>
                                    )}
                                </td>
                            );
                        })}
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

export default ShotTable;
