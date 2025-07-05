import { useParams, Link } from 'react-router-dom';
import usePagesData   from '../hooks/usePagesData';
import useSheetsData  from '../hooks/useSheetsData';
import ShotTable      from './ShotTable';

export default function PageView() {
  const { page_id } = useParams();          // URL の /page/:page_id
  const pages  = usePagesData();
  const { shots, fields } = useSheetsData();

  const preset = pages.find((p) => p.page_id === page_id);

  if (!preset) {
    return (
      <div className="p-8">
        <Link to="/" className="text-blue-600 underline">&larr; Back</Link>
        <p className="mt-4 text-red-600">Page “{page_id}” not found.</p>
      </div>
    );
  }

  /* プリセットのフィルタを適用 */
  const view = shots.filter((row) =>
    Object.entries(preset.filters).every(
      ([fid, v]) => String(row[fid]) === String(v),
    ),
  );

  return (
    <div className="p-8 space-y-4">
      <Link to="/" className="text-blue-600 underline">&larr; Back</Link>
      <h1 className="text-2xl font-bold">{preset.title}</h1>

      <ShotTable
        shots={view}
        fields={fields}
        visibleFieldIds={fields.map(f => f.id)}
        handleDragEnd={() => {}}
        handleColResizeMouseDown={() => {}}
        sortKey="shot_id"
        ascending={true}
        onSort={() => {}}
      />
    </div>
  );
}
