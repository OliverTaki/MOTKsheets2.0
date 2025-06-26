import React, { useState, useContext } from 'react';
import { AuthContext } from '../AuthContext';

const SaveViewControl = ({ onSave, currentFilters }) => {
    const [viewName, setViewName] = useState('');
    // useAuth() の代わりに useContext(AuthContext) を使用します
    const { token } = useContext(AuthContext);

    const handleSave = () => {
        if (!viewName.trim()) {
            // alert()は使わない方針でしたが、一時的に残します。
            // 本来はモーダルウィンドウ等で通知するのが望ましいです。
            alert('Please enter a name for this view.');
            return;
        }
        // onSaveのロジックはまだ実装されていないため、コンソールに出力します
        console.log(`Saving view "${viewName}" with filters:`, currentFilters);
        // onSave(viewName, currentFilters);
        setViewName('');
    };
    
    // トークンがなければ（ログインしていなければ）このコンポーネントは表示しません
    if (!token) {
        return null;
    }

    return (
        <div className="flex items-center space-x-2">
            <input
                type="text"
                value={viewName}
                onChange={(e) => setViewName(e.target.value)}
                placeholder="Save current view as..."
                className="p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
                Save View
            </button>
        </div>
    );
};

export default SaveViewControl;
