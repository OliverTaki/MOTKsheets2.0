import React, { useState, useRef, useEffect } from 'react';
import { PencilIcon } from '@heroicons/react/24/solid';

export default function ShotTable({ shots, fields, sortKey, ascending, onSort, onCellSave }) {
    const [editingCell, setEditingCell] = useState(null);
    const [editValue, setEditValue] = useState("");
    const inputRef = useRef(null);
    const [token, setToken] = useState(null);

    useEffect(() => {
        if (typeof window !== 'undefined' && window.gapi) {
            const authInstance = window.gapi.auth2.getAuthInstance();
            if (authInstance && authInstance.isSignedIn.get()) {
                setToken(authInstance.currentUser.get().getAuthResponse().access_token);
            }
        }
    }, []);


    useEffect(() => {
        if (editingCell && inputRef.current) {
            inputRef.current.focus();
        }
    }, [editingCell]);

    const handleCellClick = (rowIndex, colIndex, value) => {
        setEditingCell({ rowIndex, colIndex });
        setEditValue(value);
    };

    const handleInputChange = (e) => {
        setEditValue(e.target.value);
    };

    const handleInputBlur = () => {
        if (editingCell) {
            const { rowIndex, colIndex } = editingCell;
            const originalValue = shots[rowIndex][fields[colIndex].id];
            if (editValue !== originalValue) {
                onCellSave(rowIndex, fields[colIndex].id, editValue, token);
            }
            setEditingCell(null);
        }
    };

    const handleInputKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleInputBlur();
        } else if (e.key === 'Escape') {
            setEditingCell(null);
        }
    };

    const getFieldById = (id) => fields.find(f => f.id === id);

    return (
        <div className="overflow-x-auto relative shadow-md sm:rounded-lg">
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                    <tr>
                        {fields.map((field) => (
                            <th key={field.id} scope="col" className="py-3 px-6" onClick={() => onSort(field.id)}>
                                {field.label}
                                {sortKey === field.id && (<span>{ascending ? ' ▲' : ' ▼'}</span>)}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {shots.map((shot, rowIndex) => (
                        <tr key={shot.id || rowIndex} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                            {fields.map((field, colIndex) => {
                                const isEditing = editingCell && editingCell.rowIndex === rowIndex && editingCell.colIndex === colIndex;
                                return (
                                    <td key={field.id} className="py-4 px-6">
                                        {isEditing ? (
                                            <input
                                                ref={inputRef}
                                                type="text"
                                                value={editValue}
                                                onChange={handleInputChange}
                                                onBlur={handleInputBlur}
                                                onKeyDown={handleInputKeyDown}
                                                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                                            />
                                        ) : (
                                            <div className="flex items-center" onClick={() => handleCellClick(rowIndex, colIndex, shot[field.id])}>
                                                <span>{shot[field.id]}</span>
                                                <PencilIcon className="w-4 h-4 ml-2 text-gray-400 opacity-0 group-hover:opacity-100" />
                                            </div>
                                        )}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
