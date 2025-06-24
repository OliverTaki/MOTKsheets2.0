import { useParams, Link } from 'react-router-dom';
import useSheetsData from '../hooks/useSheetsData';

export default function ShotDetailPage() {
  const { id } = useParams();                 // /shot/:id → id は文字列
  const { shots, fields } = useSheetsData();

  const shot = shots.find((s) => String(s.shot_id) === id);

  if (!shot) {
    return (
      <div className="p-8">
        <Link to="/" className="text-blue-600 underline">&larr; Back</Link>
        <p className="mt-4 text-red-600">Shot ID {id} not found.</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <Link to="/" className="text-blue-600 underline">&larr; Back</Link>

      <h2 className="text-2xl font-bold">Shot {shot.shot_code || id}</h2>

      <div className="grid gap-4 md:grid-cols-2">
        {fields.map((f) => (
          <div key={f.field_id} className="border p-4 rounded">
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">
              {f.field_name}
            </h3>

            {f.field_id === 'thumbnail' ? (
              <img src={shot[f.field_id]} alt="" className="h-24 w-auto" />
            ) : (
              <p className="text-sm whitespace-pre-wrap break-all">
                {shot[f.field_id] ?? '-'}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
