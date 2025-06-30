import React from 'react';
import { PencilIcon } from '@heroicons/react/24/solid';
import { Link } from 'react-router-dom';

// リサイズ機能とソート機能は、UIが完全に安定した後に改めて実装します。
const ShotTable = ({ shots, fields, columnWidths = {} }) => {
    return (
        // `table-fixed`でレイアウト計算を固定にし、親のレイアウトから完全に独立させます。
        <table className="table-fixed text-sm text-left text-gray-500 dark:text-gray-400 border-collapse">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400 sticky top-0 z-10">
                <tr>
                    {fields.map((field) => {
                        // App.jsxから渡される幅、またはデフォルト幅をピクセル単位で指定します。
                        const style = { width: `${columnWidths[field.id] || 150}px` };
                        
                        return (
                            // ヘッダーの上下パディングをpy-2に設定
                            <th key={field.id} scope="col" style={style} className="py-2 px-3 border border-gray-200 dark:border-gray-600 font-medium">
                                {field.label}
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
                            // セル自体のパディングを削除
                            const tdClassName = "border border-gray-200 dark:border-gray-600";

                            return (
                                <td key={field.id} className={tdClassName} style={{ position: 'relative' }}>
                                    {/* コンテンツエリア */}
                                    <div className="overflow-hidden whitespace-nowrap" style={{ padding: '0px 4px' }}>
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
                                    {/* アイコンはtdを基準に絶対配置 */}
                                    {field.id !== 'thumbnail' && (
                                        <PencilIcon
                                            style={{
                                                position: 'absolute',
                                                top: '2px',    // 必要に応じて微調整
                                                right: '2px',
                                                width: '11px',
                                                height: '11px'
                                            }}
                                            className="text-gray-400 opacity-0 hover:opacity-100 group-hover:opacity-100 cursor-pointer"
                                            onClick={() => console.log(`Edit clicked for row ${rowIndex}, field ${field.id}`)}
                                        />
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
