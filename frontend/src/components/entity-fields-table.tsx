import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function EntityFieldsTable({
  fields,
  title = "Fields",
}: {
  fields: Record<string, string>;
  title?: string;
}) {
  const entries = Object.entries(fields).sort(([a], [b]) => a.localeCompare(b));

  return (
    <Card>
      <CardHeader className="pb-2 sm:pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0 sm:p-0">
        <div className="-mx-px overflow-x-auto rounded-b-xl">
          <table className="w-full min-w-[320px] text-sm">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:px-6">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:px-6">
                  Type
                </th>
              </tr>
            </thead>
            <tbody>
              {entries.map(([name, type]) => (
                <tr
                  key={name}
                  className="border-b border-white/5 transition-colors hover:bg-white/[0.02]"
                >
                  <td className="px-4 py-2.5 font-mono text-xs sm:px-6 sm:text-sm">
                    {name}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-[#00F0FF]/85 sm:px-6 sm:text-sm">
                    {type}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
