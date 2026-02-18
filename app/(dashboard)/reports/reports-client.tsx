"use client";

import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

type ReportsClientProps = {
  data: any;
};

const COLORS = ["#00B8A9", "#F6D743", "#F6416C", "#43DDE6", "#FF9A00"];

export default function ReportsClient({ data }: ReportsClientProps) {
  const { workload, instructors, roomUsage, rooms, conflicts } = data;

  const workloadData = workload.map((w: any) => {
    const inst = instructors.find((i: any) => i.id === w.instructorId);
    return {
      name: inst?.name ?? "Unknown",
      value: w._count._all
    };
  });

  const roomData = roomUsage.map((r: any, idx: number) => {
    const room = rooms.find((rr: any) => rr.id === r.roomId);
    return {
      name: room?.code ?? `Room ${idx + 1}`,
      value: r._count._all
    };
  });

  const downloadCsv = () => {
    const rows = [
      ["Report", "Entity", "Value"],
      ...workloadData.map((w: any) => ["Instructor workload", w.name, String(w.value)]),
      ...roomData.map((r: any) => ["Room utilization", r.name, String(r.value)])
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "opticore-reports.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5 text-xs">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-50">
            Reporting & Schedule Intelligence
          </h1>
          <p className="text-xs text-slate-400">
            Instructor workload, room utilization, and conflict summaries with export.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={downloadCsv}>
          Export CSV (Excel-ready)
        </Button>
      </div>

      <section className="glass-panel grid gap-4 rounded-2xl px-4 py-4 md:grid-cols-2">
        <div className="h-64">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Instructor Workload
          </p>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={workloadData}>
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#00B8A9" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="h-64">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Room Utilization
          </p>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={roomData}
                dataKey="value"
                nameKey="name"
                outerRadius={80}
                label={(e) => e.name}
              >
                {roomData.map((_: any, index: number) => (
                  <Cell
                    key={index}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="glass-panel rounded-2xl px-4 py-4">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
          Conflict Summary
        </p>
        <div className="max-h-60 overflow-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead className="bg-slate-900/80 text-[11px] uppercase tracking-[0.14em] text-slate-400">
              <tr>
                <th className="px-3 py-2">Subject</th>
                <th className="px-3 py-2">Instructor</th>
                <th className="px-3 py-2">Section</th>
                <th className="px-3 py-2">Room</th>
                <th className="px-3 py-2">Reason</th>
              </tr>
            </thead>
            <tbody>
              {conflicts.map((c: any) => (
                <tr key={c.id} className="odd:bg-slate-900/40">
                  <td className="px-3 py-2">{c.subject.code}</td>
                  <td className="px-3 py-2">{c.instructor.name}</td>
                  <td className="px-3 py-2">{c.section.name}</td>
                  <td className="px-3 py-2">{c.room.code}</td>
                  <td className="px-3 py-2">{c.reason}</td>
                </tr>
              ))}
              {conflicts.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-3 py-6 text-center text-[11px] text-slate-400"
                  >
                    No pending change or conflict requests at the moment.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      <p className="text-[11px] text-slate-500">
        For full PDF export, you can later integrate a lightweight library such as
        `pdfkit` or use a server-side HTML-to-PDF service, calling it from this page
        via a Server Action.
      </p>
    </div>
  );
}

