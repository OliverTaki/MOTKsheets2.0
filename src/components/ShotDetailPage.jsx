import React from 'react';
import { useParams, Link } from 'react-router-dom';
import useSheetsData from '../hooks/useSheetsData';
import { useAuth } from '../AuthContext';

export default function ShotDetailPage() {
  const { id } = useParams();
  const { auth } = useAuth();
  const { shots, fields, loading, error } = useSheetsData();

  if (loading || auth.isLoading) {
    return <div className="p-8 text-center text-gemini-text-secondary">Loading shot details...</div>;
  }
  if (error) {
    return <div className="p-8 text-center text-red-400">Error: {error}</div>;
  }
  const shot = shots.find((s) => s.shot_id === id);
  if (!shot) {
    return (
      <div className="p-8 text-center text-gemini-text-secondary">
        <h2 className="text-xl">Shot not found.</h2>
        <Link to="/" className="text-blue-400 hover:underline mt-4 inline-block">&larr; Back to list</Link>
      </div>
    );
  }
  const displayableFields = fields.filter(f => f.type !== 'uuid');

  return (
    <div className="min-h-screen p-4 sm:p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <Link to="/" className="text-blue-400 hover:underline text-sm mb-6 inline-block">&larr; Back to Shot List</Link>
        <h1 className="text-3xl font-bold mb-2">
          Shot: <span className="text-gray-300">{shot.shot_code || `ID ${shot.shot_id}`}</span>
        </h1>
        <hr className="border-gemini-border my-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          {displayableFields.map((field) => (
            <div key={field.field_id} className="py-2">
              <h3 className="text-sm font-semibold text-gemini-text-secondary uppercase tracking-wider mb-1">
                {field.field_name}
              </h3>
              {field.type === 'image' && shot[field.field_id] ? (
                <img src={shot[field.field_id]} alt={`Thumbnail for ${shot.shot_code}`} className="mt-2 rounded-lg max-w-xs shadow-lg" />
              ) : (
                <p className="text-base text-gray-200 whitespace-pre-wrap break-words">
                  {shot[field.field_id] || <span className="text-gray-500">N/A</span>}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
