export default function ShotDetailRow({ shot, fields }: any) {
  return (
    <div className="p-4 bg-gray-700">
      <h2 className="text-sm font-semibold mb-2">Shot {shot.shot_code}</h2>
      <ul className="text-sm space-y-1">
        {fields.map((f: any) => (
          <li key={f.field_id}>
            <span className="font-medium">{f.field_name}: </span>
            {String(shot[f.field_id] ?? '')}
          </li>
        ))}
      </ul>
    </div>
  );
}
