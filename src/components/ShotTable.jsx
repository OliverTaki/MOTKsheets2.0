import { Fragment } from 'react';
import ShotDetailRow from './ShotDetailRow';

export default function ShotTable({
  shots,
  fields,
  selected,
  onSelect,
}: any) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white shadow rounded-lg">
        <thead className="bg-gray-200 text-gray-700 text-xs uppercase">
          <tr>
            {fields.map((f: any) => (
              <th key={f.field_id} className="px-4 py-2 text-left">
                {f.field_name}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-200">
          {shots.map((shot: any) => (
            <Fragment key={shot.shot_id}>
              {/* 一覧行 */}
              <tr
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() =>
                  onSelect(
                    selected?.shot_id === shot.shot_id ? null : shot,
                  )
                }
              >
                {fields.map((f: any) => (
                  <td key={f.field_id} className="px-4 py-2 whitespace-nowrap">
                    {shot[f.field_id]}
                  </td>
                ))}
              </tr>

              {/* 詳細行（選択中だけ） */}
              {selected?.shot_id === shot.shot_id && (
                <tr>
                  <td colSpan={fields.length}>
                    <ShotDetailRow shot={shot} fields={fields} />
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
