import React, { useState, useEffect, useRef } from 'react';
import { EyeIcon, EyeSlashIcon, PlusIcon } from '@heroicons/react/24/solid';

// allFieldsとvisibleFieldIdsにデフォルト値として空の配列[]を設定し、クラッシュを防ぎます
const FieldManager = ({ allFields = [], visibleFieldIds = [], onVisibilityChange, onAddField }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [newField, setNewField] = useState({
        label: '',
        type: 'text',
        editable: true,
        options: ''
    });
    const wrapperRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setIsOpen(false);
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    const handleAddFieldClick = () => {
        if (newField.label.trim()) {
            onAddField(newField);
            setNewField({ label: '', type: 'text', editable: true, options: '' });
        }
    };

    return (
        <div className="relative" ref={wrapperRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
            >
                Fields
            </button>

            {isOpen && (
                <div className="absolute top-full mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-20">
                    <div className="p-3 space-y-3">
                        <div>
                            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">Manage Fields</h3>
                            <div className="max-h-60 overflow-y-auto pr-2">
                                {allFields.map(field => (
                                    <div key={field.id} className="flex items-center justify-between py-1.5">
                                        <span className="text-sm text-gray-800 dark:text-gray-200">{field.label}</span>
                                        <button onClick={() => onVisibilityChange(field.id)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                            {visibleFieldIds.includes(field.id) ? <EyeIcon className="w-5 h-5" /> : <EyeSlashIcon className="w-5 h-5" />}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="border-t border-gray-200 dark:border-gray-700 pt-3 space-y-2">
                            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Add New Field</h3>
                            <input
                                type="text"
                                value={newField.label}
                                onChange={e => setNewField({...newField, label: e.target.value})}
                                placeholder="Field Name"
                                className="w-full px-3 py-2 rounded-md sm:text-sm border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                            <select value={newField.type} onChange={e => setNewField({...newField, type: e.target.value})} className="w-full px-3 py-2 rounded-md sm:text-sm border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                <option value="text">Text</option>
                                <option value="select">Select</option>
                                <option value="image">Image</option>
                                <option value="uuid">UUID</option>
                            </select>
                            {newField.type === 'select' && (
                                <input
                                    type="text"
                                    value={newField.options}
                                    onChange={e => setNewField({...newField, options: e.target.value})}
                                    placeholder="Options (comma-separated)"
                                    className="w-full px-3 py-2 rounded-md sm:text-sm border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                />
                            )}
                            <label className="flex items-center text-sm">
                                <input type="checkbox" checked={newField.editable} onChange={e => setNewField({...newField, editable: e.target.checked})} className="h-4 w-4 rounded border-gray-300"/>
                                <span className="ml-2 text-gray-700 dark:text-gray-300">Editable</span>
                            </label>
                            <button onClick={handleAddFieldClick} className="w-full inline-flex justify-center items-center px-3 py-2 rounded-md bg-blue-500 text-white hover:bg-blue-600">
                                <PlusIcon className="w-5 h-5 mr-2" /> Add
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FieldManager;
