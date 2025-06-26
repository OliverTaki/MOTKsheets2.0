import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import ShotDetailRow from './ShotDetailRow';
import { AuthContext } from '../AuthContext';
import { updateCell } from '../api/updateCell';

const spreadsheetId = import.meta.env.VITE_GOOGLE_SHEET_ID;
const sheetName = 'Shots';

const ShotDetailPage = ({ shots, fields }) => {
    const { shotId } = useParams();
    const [shot, setShot] = useState(null);
    const { token } = useContext(AuthContext);

    useEffect(() => {
        const currentShot = shots.find(s => String(s.id) === String(shotId));
        setShot(currentShot);
    }, [shotId, shots]);

    const handleSave = async (fieldId, value) => {
        if (!shot || !token) {
            alert('Cannot save. No shot data or user is not authenticated.');
            return;
        }

        // スプレッドシート上の行インデックスを見つける (データ行は2行目からなので+2)
        const dataRowIndex = shots.findIndex(s => s.id === shot.id);
        if (dataRowIndex === -1) {
            console.error("Could not find row index for shot");
            alert("Error: Could not find the shot's row index.");
            return;
        }
        const sheetRowIndex = dataRowIndex + 2; // +1 for 1-based index, +1 for header row

        // スプレッドシート上の列インデックスを見つける
        const sheetColumnIndex = fields.findIndex(f => f.id === fieldId);
        if (sheetColumnIndex === -1) {
            console.error(`Could not find column index for field: ${fieldId}`);
            alert(`Error: Could not find the column index for ${fieldId}.`);
            return;
        }

        try {
            await updateCell(spreadsheetId, sheetName, sheetRowIndex, sheetColumnIndex, value, token);
            // ローカルのstateを更新して即時反映
            const updatedShot = { ...shot, [fieldId]: value };
            setShot(updatedShot);
            
            // TODO: この変更をAppコンポーネントの全体stateに反映させる必要があります。
            // 現状では、このページ内でのみ変更が反映されます。
            console.log('Update successful locally. State management for global updates is needed.');

        } catch (error) {
            console.error('Failed to update cell:', error);
            alert(`Error updating sheet: ${error.message}`);
        }
    };

    if (!shot) {
        return (
             <div className="text-center p-8">
                <p>Loading shot details or shot not found...</p>
                <Link to="/" className="text-blue-500 hover:underline mt-4 inline-block">Back to list</Link>
            </div>
        );
    }

    return (
        <div className="p-4 max-w-4xl mx-auto">
            <Link to="/" className="text-blue-500 hover:underline mb-4 inline-block">&larr; Back to Shot List</Link>
            <h1 className="text-3xl font-bold mb-4">Shot Detail: {shot.id}</h1>
            <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4">
                {fields.map(field => (
                    <ShotDetailRow
                        key={field.id}
                        field={field}
                        value={shot[field.id] || ''}
                        onSave={handleSave}
                    />
                ))}
            </div>
        </div>
    );
};

export default ShotDetailPage;
