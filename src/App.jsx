import { useState, useRef } from "react";
import {
  Plus, Trash2, Check, ListTodo, Search, X, Calendar,
  Briefcase, User, ShoppingBag, HeartPulse, LayoutGrid,
} from "lucide-react";

const PRIORITIES = {
  low: { label: "ต่ำ", badge: "bg-emerald-50 text-emerald-700 ring-emerald-200", border: "border-l-emerald-400", active: "bg-emerald-500 text-white" },
  medium: { label: "ปานกลาง", badge: "bg-amber-50 text-amber-700 ring-amber-200", border: "border-l-amber-400", active: "bg-amber-500 text-white" },
  high: { label: "สูง", badge: "bg-red-50 text-red-700 ring-red-200", border: "border-l-red-400", active: "bg-red-500 text-white" },
};
const NEXT_PRIORITY = { low: "medium", medium: "high", high: "low" };

const CATEGORIES = {
  work: { label: "งาน", Icon: Briefcase, badge: "bg-blue-50 text-blue-700 ring-blue-200" },
  personal: { label: "ส่วนตัว", Icon: User, badge: "bg-violet-50 text-violet-700 ring-violet-200" },
  shopping: { label: "ช้อปปิ้ง", Icon: ShoppingBag, badge: "bg-pink-50 text-pink-700 ring-pink-200" },
  health: { label: "สุขภาพ", Icon: HeartPulse, badge: "bg-teal-50 text-teal-700 ring-teal-200" },
};
const CAT_KEYS = Object.keys(CATEGORIES);

const FILTERS = [
  { key: "all", label: "ทั้งหมด" },
  { key: "active", label: "ยังไม่เสร็จ" },
  { key: "completed", label: "เสร็จแล้ว" },
];
const EMPTY = {
  all: "ยังไม่มีงาน เพิ่มงานแรกของคุณได้เลย",
  active: "ไม่มีงานที่ค้างอยู่ เยี่ยมมาก!",
  completed: "ยังไม่มีงานที่เสร็จแล้ว",
};

/* ---------- date helpers (local time, "YYYY-MM-DD") ---------- */
const pad = (n) => String(n).padStart(2, "0");
const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const offsetDay = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return toISO(d);
};
const fmtDate = (s) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("th-TH", { day: "numeric", month: "short" });
};
const dueState = (todo, today) => {
  if (!todo.due) return "none";
  if (todo.done) return "done";
  if (todo.due < today) return "overdue";
  if (todo.due === today) return "today";
  return "future";
};

const DUE_STYLES = {
  overdue: "bg-red-100 text-red-700 ring-red-300",
  today: "bg-yellow-100 text-yellow-800 ring-yellow-300",
  future: "bg-slate-50 text-slate-600 ring-slate-200",
  done: "bg-slate-50 text-slate-400 ring-slate-200",
  none: "bg-white text-slate-400 ring-slate-200",
};

function DueBadge({ due, state, onChange }) {
  const label =
    state === "none" ? "กำหนดวัน"
    : state === "overdue" ? `เลยกำหนด ${fmtDate(due)}`
    : state === "today" ? "วันนี้"
    : fmtDate(due);
  return (
    <label
      title="แตะเพื่อเปลี่ยนวันครบกำหนด"
      className={`relative inline-flex cursor-pointer items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${DUE_STYLES[state]}`}
    >
      <Calendar size={12} />
      {label}
      <input
        type="date"
        value={due || ""}
        onChange={(e) => onChange(e.target.value)}
        onClick={(e) => { try { e.currentTarget.showPicker?.(); } catch (_) {} }}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      />
    </label>
  );
}

function Donut({ segments, total, percent }) {
  let acc = 0;
  return (
    <div className="relative h-24 w-24 shrink-0">
      <svg viewBox="0 0 42 42" className="h-full w-full -rotate-90">
        <circle cx="21" cy="21" r="15.915" fill="none" stroke="#e2e8f0" strokeWidth="6" />
        {total > 0 &&
          segments.map((s) => {
            const len = (s.value / total) * 100;
            const el = (
              <circle
                key={s.key} cx="21" cy="21" r="15.915" fill="none"
                stroke={s.color} strokeWidth="6"
                strokeDasharray={`${len} ${100 - len}`} strokeDashoffset={-acc}
                style={{ transition: "stroke-dasharray 300ms ease" }}
              />
            );
            acc += len;
            return el;
          })}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-lg font-bold">
        {percent}%
      </div>
    </div>
  );
}

export default function TodoApp() {
  const [todos, setTodos] = useState([
    { id: 1, text: "ส่งรายงานประจำสัปดาห์", done: false, priority: "high", category: "work", due: offsetDay(-2), removing: false },
    { id: 2, text: "ประชุมทีมตอนบ่าย", done: false, priority: "medium", category: "work", due: offsetDay(0), removing: false },
    { id: 3, text: "ซื้อผลไม้และนม", done: false, priority: "low", category: "shopping", due: offsetDay(3), removing: false },
    { id: 4, text: "วิ่งสวนสาธารณะ 30 นาที", done: true, priority: "medium", category: "health", due: offsetDay(-1), removing: false },
    { id: 5, text: "โทรหาที่บ้าน", done: false, priority: "low", category: "personal", due: "", removing: false },
  ]);
  const [text, setText] = useState("");
  const [newPriority, setNewPriority] = useState("medium");
  const [newCategory, setNewCategory] = useState("work");
  const [newDue, setNewDue] = useState("");
  const [filter, setFilter] = useState("all");
  const [catFilter, setCatFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const nextId = useRef(6);

  const today = toISO(new Date());

  const patch = (id, changes) =>
    setTodos((t) => t.map((x) => (x.id === id ? { ...x, ...changes } : x)));

  const add = () => {
    const value = text.trim();
    if (!value) return;
    setTodos((t) => [
      { id: nextId.current++, text: value, done: false, priority: newPriority, category: newCategory, due: newDue, removing: false },
      ...t,
    ]);
    setText("");
    setNewDue("");
  };

  const animateOut = (shouldRemove) => {
    setTodos((t) => t.map((x) => (shouldRemove(x) ? { ...x, removing: true } : x)));
    setTimeout(() => setTodos((t) => t.filter((x) => !x.removing)), 280);
  };
  const remove = (id) => animateOut((x) => x.id === id);
  const clearCompleted = () => animateOut((x) => x.done);

  const startEdit = (todo) => { setEditingId(todo.id); setEditText(todo.text); };
  const saveEdit = () => {
    const value = editText.trim();
    if (value) patch(editingId, { text: value });
    setEditingId(null);
  };

  const pickCategory = (key) => {
    setCatFilter(key);
    if (key !== "all") setNewCategory(key);
  };

  /* ---------- derived data ---------- */
  const live = todos.filter((t) => !t.removing);
  const total = live.length;
  const doneCount = live.filter((t) => t.done).length;
  const overdueCount = live.filter((t) => dueState(t, today) === "overdue").length;
  const activeCount = total - doneCount - overdueCount;
  const remaining = total - doneCount;
  const percent = total ? Math.round((doneCount / total) * 100) : 0;

  const catCounts = CAT_KEYS.reduce((acc, k) => ({ ...acc, [k]: live.filter((t) => t.category === k).length }), {});
  const tabCounts = { all: total, active: remaining, completed: doneCount };

  const q = query.trim().toLowerCase();
  const visible = todos.filter(
    (t) =>
      (filter === "all" || (filter === "active" ? !t.done : t.done)) &&
      (catFilter === "all" || t.category === catFilter) &&
      (!q || t.text.toLowerCase().includes(q))
  );
  const emptyMsg = q || catFilter !== "all" ? "ไม่พบงานที่ตรงกับเงื่อนไข" : EMPTY[filter];

  const segments = [
    { key: "done", label: "เสร็จแล้ว", value: doneCount, color: "#10b981" },
    { key: "active", label: "กำลังดำเนินการ", value: activeCount, color: "#0ea5e9" },
    { key: "overdue", label: "เลยกำหนด", value: overdueCount, color: "#ef4444" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 text-slate-800 sm:py-12">
      <div className="mx-auto w-full max-w-4xl">
        <header className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white">
            <ListTodo size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold leading-tight">รายการงานของฉัน</h1>
            <p className="text-sm text-slate-500">ดับเบิลคลิกที่ข้อความเพื่อแก้ไข</p>
          </div>
        </header>

        <div className="flex flex-col gap-4 md:flex-row md:items-start">
          {/* ---------- Sidebar ---------- */}
          <aside className="shrink-0 space-y-4 md:w-60">
            <nav className="rounded-2xl bg-white p-2 shadow-md">
              <div className="flex gap-1 overflow-x-auto md:flex-col">
                {[["all", { label: "ทุกหมวด", Icon: LayoutGrid }], ...Object.entries(CATEGORIES)].map(([key, c]) => {
                  const count = key === "all" ? total : catCounts[key];
                  const on = catFilter === key;
                  return (
                    <button
                      key={key}
                      onClick={() => pickCategory(key)}
                      className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition md:w-full ${
                        on ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <c.Icon size={16} />
                      <span className="flex-1 text-left">{c.label}</span>
                      <span className={`rounded-full px-2 text-xs ${on ? "bg-white/20" : "bg-slate-100 text-slate-500"}`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </nav>

            <section className="rounded-2xl bg-white p-4 shadow-md">
              <h2 className="mb-3 text-sm font-bold text-slate-700">สถิติ</h2>
              <div className="flex items-center gap-4">
                <Donut segments={segments} total={total} percent={percent} />
                <ul className="min-w-0 flex-1 space-y-1.5 text-sm">
                  {segments.map((s) => (
                    <li key={s.key} className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: s.color }} />
                      <span className="flex-1 truncate text-slate-600">{s.label}</span>
                      <span className="font-medium">{s.value}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-3 flex justify-between border-t border-slate-100 pt-3 text-sm">
                <span className="text-slate-500">งานทั้งหมด</span>
                <span className="font-bold">{total}</span>
              </div>
              <div className="mt-1 flex justify-between text-sm">
                <span className="text-slate-500">ทำเสร็จแล้ว</span>
                <span className="font-bold">{percent}%</span>
              </div>
            </section>
          </aside>

          {/* ---------- Main ---------- */}
          <main className="min-w-0 flex-1">
            <div className="mb-4 rounded-2xl bg-white p-4 shadow-md">
              <div className="flex gap-2">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && add()}
                  placeholder="เพิ่มงานใหม่..."
                  className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-base outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                />
                <button
                  onClick={add}
                  disabled={!text.trim()}
                  className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Plus size={18} />
                  <span className="hidden sm:inline">เพิ่ม</span>
                </button>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <div className="flex rounded-xl bg-slate-100 p-1">
                  {Object.entries(PRIORITIES).map(([key, p]) => (
                    <button
                      key={key}
                      onClick={() => setNewPriority(key)}
                      className={`rounded-lg px-3 py-1 text-sm font-medium transition ${
                        newPriority === key ? p.active : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-slate-900"
                >
                  {CAT_KEYS.map((k) => (
                    <option key={k} value={k}>{CATEGORIES[k].label}</option>
                  ))}
                </select>
                <input
                  type="date"
                  value={newDue}
                  onChange={(e) => setNewDue(e.target.value)}
                  aria-label="วันครบกำหนด"
                  className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-slate-900"
                />
              </div>
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ค้นหางาน..."
                className="w-full rounded-2xl border-0 bg-white py-3 pl-11 pr-10 text-base shadow-md outline-none focus:ring-2 focus:ring-slate-300"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  aria-label="ล้างคำค้นหา"
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:text-slate-700"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Status tabs */}
            <div className="mb-4 flex rounded-2xl bg-white p-1.5 shadow-md">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`flex-1 rounded-xl px-2 py-2 text-sm font-medium transition ${
                    filter === f.key ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {f.label}
                  <span className={`ml-1.5 text-xs ${filter === f.key ? "text-slate-300" : "text-slate-400"}`}>
                    {tabCounts[f.key]}
                  </span>
                </button>
              ))}
            </div>

            {/* List */}
            <ul>
              {visible.length === 0 && (
                <li className="rounded-2xl bg-white px-4 py-10 text-center text-slate-500 shadow-md">
                  {emptyMsg}
                </li>
              )}

              {visible.map((todo) => {
                const p = PRIORITIES[todo.priority];
                const c = CATEGORIES[todo.category];
                const state = dueState(todo, today);
                return (
                  <li
                    key={todo.id}
                    style={{
                      maxHeight: todo.removing ? 0 : 160,
                      opacity: todo.removing ? 0 : 1,
                      transform: todo.removing ? "translateX(32px)" : "translateX(0)",
                      marginBottom: todo.removing ? 0 : 12,
                      transition: "max-height 280ms ease, opacity 220ms ease, transform 280ms ease, margin 280ms ease",
                    }}
                    className="overflow-hidden"
                  >
                    <div className={`flex items-start gap-3 rounded-2xl border-l-4 bg-white px-4 py-3 shadow-md ${p.border}`}>
                      <button
                        onClick={() => patch(todo.id, { done: !todo.done })}
                        aria-label={todo.done ? "ทำเครื่องหมายว่ายังไม่เสร็จ" : "ทำเครื่องหมายว่าเสร็จแล้ว"}
                        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition ${
                          todo.done ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 hover:border-slate-500"
                        }`}
                      >
                        {todo.done && <Check size={14} strokeWidth={3} />}
                      </button>

                      <div className="min-w-0 flex-1">
                        {editingId === todo.id ? (
                          <input
                            autoFocus
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            onBlur={saveEdit}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveEdit();
                              if (e.key === "Escape") setEditingId(null);
                            }}
                            className="w-full rounded-lg border border-slate-300 px-2 py-1 text-base outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                          />
                        ) : (
                          <span
                            onDoubleClick={() => startEdit(todo)}
                            className={`block cursor-text break-words select-none ${
                              todo.done ? "text-slate-400 line-through" : "text-slate-800"
                            }`}
                          >
                            {todo.text}
                          </span>
                        )}

                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          <button
                            onClick={() => patch(todo.id, { priority: NEXT_PRIORITY[todo.priority] })}
                            title="แตะเพื่อเปลี่ยนความสำคัญ"
                            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${p.badge}`}
                          >
                            {p.label}
                          </button>
                          <button
                            onClick={() =>
                              patch(todo.id, { category: CAT_KEYS[(CAT_KEYS.indexOf(todo.category) + 1) % CAT_KEYS.length] })
                            }
                            title="แตะเพื่อเปลี่ยนหมวดหมู่"
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${c.badge}`}
                          >
                            <c.Icon size={12} />
                            {c.label}
                          </button>
                          <DueBadge due={todo.due} state={state} onChange={(v) => patch(todo.id, { due: v })} />
                        </div>
                      </div>

                      <button
                        onClick={() => remove(todo.id)}
                        aria-label="ลบงาน"
                        className="shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="mt-2 flex items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-md">
              <span className="text-sm text-slate-600">เหลือ {remaining} งาน</span>
              <button
                onClick={clearCompleted}
                disabled={doneCount === 0}
                className="text-sm font-medium text-slate-600 transition hover:text-red-600 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:text-slate-300"
              >
                ล้างงานที่เสร็จแล้ว{doneCount > 0 ? ` (${doneCount})` : ""}
              </button>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
