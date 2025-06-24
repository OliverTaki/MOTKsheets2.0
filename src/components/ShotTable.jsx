import { Fragment } from 'react';
import { useNavigate } from 'react-router-dom';

/* 省略: props 説明は同じ */
export default function ShotTable({
  shots, fields, sortKey, ascending, onSort,
}) {
  const navigate = useNavigate();

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white shadow rounded-lg">
        <thead className="bg-gray-200 text-gray-700 text-xs uppercase">
          <tr>
            {fields.map((f) => {
              const sorted = sortKey === f.field_id;
              return (
                <th
                  key={f.field_id}
                  className="px-4 py-2 text-left select-none cursor-pointer"
                  onClick={() => onSort(f.field_id)}
                >
                  {f.field_name}
                  {sorted && (ascending ? ' ▲' : ' ▼')}
                </th>
              );
            })}
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-200">
          {shots.map((row) => (
            <Fragment key={row.shot_id}>
              <tr
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => navigate(`/shot/${row.shot_id}`)}
              >
                {fields.map((f) => (
                  <td key={f.field_id} className="px-4 py-2 whitespace-nowrap">
                    {f.field_id === 'thumbnail'
                      ? <img src={row[f.field_id]} alt="" className="h-12 w-auto" />
                      : row[f.field_id]}
                  </td>
                ))}
              </tr>
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
