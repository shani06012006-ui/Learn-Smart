export default function Table({ columns, data, keyField = "id", emptyMessage = "No records yet." }) {
  if (!data || data.length === 0) {
    return <p className="py-8 text-center text-sm text-ink-500">{emptyMessage}</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-ink-300">
      <table className="min-w-full divide-y divide-ink-300">
        <thead className="bg-ink-100">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-500"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-200 bg-white">
          {data.map((row) => (
            <tr key={row[keyField]} className="hover:bg-ink-100/50">
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 text-sm text-ink-900">
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
