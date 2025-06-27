import React, { useState, useEffect, useRef } from 'react';
import { PencilIcon } from '@heroicons/react/24/solid';
import { Link } from 'react-router-dom';

// onSort, sortKey, ascending をpropsから完全に削除しました
const ShotTable = ({ shots, fields, columnWidths, onColumnResize }) => {
    // 現在リサイズ中の列のIDを追跡します
    const [resizingFieldId, setResizingFieldId] = useState(null);
    
    // ドラッグ開始時のカーソル位置と列の幅を保持するためのRef
    const startCursorX = useRef(0);
    const startColumnWidth = useRef(0);

    // リサイズハンドルのマウス押下イベント
    const handleMouseDown = (e, fieldId) => {
        // テキスト選択などのブラウザのデフォルト動作を停止します
        e.preventDefault();
        e.stopPropagation();

        setResizingFieldId(fieldId); // リサイズ対象の列のIDをセット
        startCursorX.current = e.clientX; // 初期のマウスX座標を記録
        startColumnWidth.current = columnWidths[fieldId] || 150; // 初期の列幅を記録
    };

    // リサイズ中のマウス移動とマウスボタン解放を監視するEffect
    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!resizingFieldId) return;
            e.preventDefault();

            const deltaX = e.clientX - startCursorX.current;
            const newWidth = startColumnWidth.current + deltaX;
            
            // 列が消えてしまわないように、最小幅を60pxに制限します
            onColumnResize(resizingFieldId, Math.max(60, newWidth));
        };

        const handleMouseUp = () => {
            setResizingFieldId(null);
        };

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
                        const style = { width: columnWidths[field.id] ? `${columnWidths[field.id]}px` : '150px' };
                        
                        return (
                            <th key={field.id} scope="col" style={style} className="py-2 px-3 border border-gray-200 dark:border-gray-600 relative select-none">
                                {/* ソート機能を完全に削除し、シンプルな構造にしました */}
                                <div className="truncate h-full flex items-center">
                                    {field.label}
                                </div>
                                
                                {/* 各列の右端に配置された、当たり判定の広いリサイズハンドル */}
                                <div
                                    className="group absolute top-0 right-[-5px] h-full w-[10px] cursor-col-resize z-20"
                                    onMouseDown={(e) => handleMouseDown(e, field.id)}
                                >
                                  {/* ハンドルの視覚的なインジケータ */}
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
                            const tdClassName = "py-2 px-3 border border-gray-200 dark:border-gray-600";

                            return (
                                <td key={field.id} className={tdClassName}>
                                    <div className="group relative overflow-hidden whitespace-nowrap">
                                        {field.id === 'thumbnail' ? (
                                            cellValue && <img src={cellValue.replace("via.placeholder.com", "placehold.co")} alt={`Thumbnail for ${shot.shot_code}`} className="max-h-12 w-auto object-contain" onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/120x68/EFEFEF/AAAAAA?text=Error'; }} />
                                        ) : (
                                            <>
                                                {field.id === 'shot_code' ? (
                                                    <Link to={`/shot/${shot.shot_id}`} className="font-medium text-blue-600 dark:text-blue-500 hover:underline" title={cellValue}>
                                                        {cellValue}
                                                    </Link>
                                                ) : (
                                                    <span title={cellValue}>{cellValue}</span>
                                                )}
                                                <PencilIcon
                                                    className="absolute top-1/2 -translate-y-1/2 right-0 inline-block w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 cursor-pointer"
                                                    onClick={() => console.log(`Edit clicked for row ${rowIndex}, field ${field.id}`)}
                                                />
                                            </>
                                        )}
                                    </div>
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
