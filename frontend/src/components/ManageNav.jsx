export default function ManageNav({ active, onChange }) {
  const items = [
    { key: "projects", label: "Projects" },
    { key: "employees", label: "Employees" },
    { key: "shifts", label: "Shifts" },
    { key: "assignments", label: "Assignments" },
    { key: "holidays", label: "Holidays" },
  ];

  return (
    <aside className="manage-nav">
      <h2>Manage</h2>

      {items.map(item => (
        <button
          key={item.key}
          className={active === item.key ? "active" : ""}
          onClick={() => onChange(item.key)}
        >
          {item.label}
        </button>
      ))}
    </aside>
  );
}
