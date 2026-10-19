import { sizeGuideSectionSchema } from "@/lib/landing/sections";
import SectionShell from "./SectionShell";

export default function SizeGuideSection({ section }: { section: unknown }) {
  const parsed = sizeGuideSectionSchema.safeParse(section);
  if (!parsed.success || parsed.data.hidden) return null;
  const { props } = parsed.data;

  return (
    <SectionShell>
      {props.title ? (
        <h2 className="mb-4 text-xl font-bold sm:text-2xl">{props.title}</h2>
      ) : null}
      <div className="overflow-x-auto rounded-xl border border-black/10">
        <table className="w-full min-w-[480px] border-collapse text-sm">
          <thead>
            <tr className="bg-black/5">
              {props.columns.map((column, i) => (
                <th
                  key={`${column}-${i}`}
                  className="border-b border-black/10 px-3 py-2 text-start font-bold"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {props.rows.map((row, i) => (
              <tr key={`row-${i}`}>
                {row.map((cell, j) => (
                  <td
                    key={`cell-${i}-${j}`}
                    className="border-b border-black/5 px-3 py-2 last:border-b-0"
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionShell>
  );
}
