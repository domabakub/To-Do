import { useState, useRef } from "react";
import { Plus, Trash2, Check, ListTodo } from "lucide-react";

const PRIORITIES = {
  low: {
    label: "ต่ำ",
    badge: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    border: "border-l-emerald-400",
    active: "bg-emerald-500 text-white",
  },
  medium: {
    label: "ปานกลาง",
    badge: "bg-amber-50 text-amber-700 ring-amber-200",
    border: "border-l-amber-400",
    active: "bg-amber-500 text-white",
  },
  high: {
    label: "สูง",
    badge: "bg-red-50 text-red-700 ring-red-200",
    border: "border-l-red-400",
    active: "bg-red-500 text-white",
  },
};

const NEXT = { low: "medium", medium: "high", high: "low" };

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

export default function TodoApp() {
  const [todos, setTodos] = useState([
    { id: 1, text: "ตอบอีเมลลูกค้า", done: false, priority: "high", removing: false },
    { id: 2, text: "ซื้อของเข้าบ้าน", done: false, priority: "medium", removing: false },
    { id: 3, text: "อ่านหนังสือ 20 หน้า", done: true, priority: "low", removing: false },
  ]);
  const [text, setText] = useState("");
  const [priority, setPriority] = useState("medium");
  const [filter, setFilter] = useState("all");
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const nextId = useRef(4);

  const add = () => {
    const value = text.trim();
    if (!value) return;
    setTodos((t) => [
      { id: nextId.current++, text: value, done: false, priority, removing: false },
      ...t,
    ]);
    setText("");
  };

  const toggle = (id) =>
    setTodos((t) => t.map((x) => (x.id === id ? { ...x, done: !x.done } : x)));

  const cyclePriority = (id) =>
    setTodos((t) =>
      t.map((x) => (x.id === id ? { ...x, priority: NEXT[x.priority] } : x))
    );

  // Mark as removing to play the exit animation, then drop from state
  const animateOut = (shouldRemove) => {
    setTodos((t) => t.map((x) => (shouldRemove(x) ? { ...x, removing: true } : x)));
    setTimeout(() => setTodos((t) => t.filter((x) => !x.removing)), 280);
  };

  const remove = (id) => animateOut((x) => x.id === id);
  const clearCompleted = () => animateOut((x) => x.done);

  const startEdit = (todo) => {
    setEditingId(todo.id);
    setEditText(todo.text);
  };

  const saveEdit = () => {
    const value = editText.trim();
    if (value) {
      setTodos((t) => t.map((x) => (x.id === editingId ? { ...x, text: value } : x)));
    }
    setEditingId(null);
  };

  const remaining = todos.filter((t) => !t.done && !t.removing).length;
  const completedCount = todos.filter((t) => t.done && !t.removing).length;
  const counts = {
    all: todos.filter((t) => !t.removing).length,
    active: remaining,
    completed: completedCount,
  };

  const visible = todos.filter((t) =>
    filter === "all" ? true : filter === "active" ? !t.done : t.done
  );

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:py-12 text-slate-800">
      <div className="mx-auto w-full max-w-xl">
        <header className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white">
            <ListTodo size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold leading-tight">รายการงานของฉัน</h1>
            <p className="text-sm text-slate-500">
              ดับเบิลคลิกที่ข้อความเพื่อแก้ไข
            </p>
          </div>
        </header>

        {/* Add form */}
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

          <div className="mt-3 flex items-center gap-2">
            <span className="text-sm text-slate-500">ความสำคัญ</span>
            <div className="flex rounded-xl bg-slate-100 p-1">
              {Object.entries(PRIORITIES).map(([key, p]) => (
                <button
                  key={key}
                  onClick={() => setPriority(key)}
                  className={`rounded-lg px-3 py-1 text-sm font-medium transition ${
                    priority === key ? p.active : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="mb-4 flex rounded-2xl bg-white p-1.5 shadow-md">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`flex-1 rounded-xl px-2 py-2 text-sm font-medium transition ${
                filter === f.key
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {f.label}
              <span
                className={`ml-1.5 text-xs ${
                  filter === f.key ? "text-slate-300" : "text-slate-400"
                }`}
              >
                {counts[f.key]}
              </span>
            </button>
          ))}
        </div>

        {/* List */}
        <ul>
          {visible.length === 0 && (
            <li className="rounded-2xl bg-white px-4 py-10 text-center text-slate-500 shadow-md">
              {EMPTY[filter]}
            </li>
          )}

          {visible.map((todo) => {
            const p = PRIORITIES[todo.priority];
            return (
              <li
                key={todo.id}
                style={{
                  maxHeight: todo.removing ? 0 : 120,
                  opacity: todo.removing ? 0 : 1,
                  transform: todo.removing ? "translateX(32px)" : "translateX(0)",
                  marginBottom: todo.removing ? 0 : 12,
                  transition:
                    "max-height 280ms ease, opacity 220ms ease, transform 280ms ease, margin 280ms ease",
                }}
                className="overflow-hidden"
              >
                <div
                  className={`flex items-center gap-3 rounded-2xl border-l-4 bg-white px-4 py-3 shadow-md ${p.border}`}
                >
                  <button
                    onClick={() => toggle(todo.id)}
                    aria-label={todo.done ? "ทำเครื่องหมายว่ายังไม่เสร็จ" : "ทำเครื่องหมายว่าเสร็จแล้ว"}
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition ${
                      todo.done
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-300 hover:border-slate-500"
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
                  </div>

                  <button
                    onClick={() => cyclePriority(todo.id)}
                    title="แตะเพื่อเปลี่ยนความสำคัญ"
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${p.badge}`}
                  >
                    {p.label}
                  </button>

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

        {/* Footer */}
        <div className="mt-2 flex items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-md">
          <span className="text-sm text-slate-600">เหลือ {remaining} งาน</span>
          <button
            onClick={clearCompleted}
            disabled={completedCount === 0}
            className="text-sm font-medium text-slate-600 transition hover:text-red-600 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:text-slate-300"
          >
            ล้างงานที่เสร็จแล้ว{completedCount > 0 ? ` (${completedCount})` : ""}
          </button>
        </div>
      </div>
    </div>
  );
}
