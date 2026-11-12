import {
  FaBan,
  FaCalendarAlt,
  FaChartBar,
  FaClipboardList,
  FaDoorOpen,
  FaLaptop,
  FaTools,
  FaUserCog,
} from "react-icons/fa";

const DASHBOARD_ITEMS = [
  { id: "dashboard-summary", label: "Resumen", icon: FaChartBar },
  { id: "dashboard-assign", label: "Asignar salón", icon: FaDoorOpen },
  { id: "dashboard-assign-equipment", label: "Asignar equipo", icon: FaLaptop },
  {
    id: "dashboard-reservations",
    label: "Reservas por gestionar",
    icon: FaClipboardList,
  },
  {
    id: "dashboard-equipment-reservations",
    label: "Préstamos de equipos",
    icon: FaTools,
  },
  { id: "dashboard-cancelled", label: "Cancelaciones", icon: FaBan },
  { id: "dashboard-analytics", label: "Estadísticas", icon: FaChartBar },
  { id: "dashboard-upcoming", label: "Próximas reservas", icon: FaCalendarAlt },
];

const ADMIN_ITEMS = [
  ...DASHBOARD_ITEMS,
  { id: "accounts", label: "Cuentas y roles", icon: FaUserCog },
];

export default function StaffNavigation({ role, activeView, onViewChange }) {
  const items = role === "admin" ? ADMIN_ITEMS : DASHBOARD_ITEMS;

  return (
    <aside className="sticky top-17 z-30 -mx-4 mb-5 border-y border-slate-200 bg-white/95 px-4 py-2 backdrop-blur lg:top-24 lg:mx-0 lg:mb-0 lg:border-0 lg:bg-transparent lg:p-0">
      <p className="mb-3 hidden px-3 text-xs font-bold uppercase tracking-wider text-slate-500 lg:block">
        Navegación
      </p>
      <nav
        aria-label="Secciones del panel"
        className="mx-auto flex max-w-screen-2xl gap-1 overflow-x-auto lg:block lg:max-w-none lg:space-y-1 lg:overflow-visible"
      >
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              aria-current={isActive ? "page" : undefined}
              onClick={() => onViewChange(item.id)}
              className={`flex min-h-10 shrink-0 items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium transition lg:w-full ${
                isActive
                  ? "bg-sky-700 text-white"
                  : "text-slate-700 hover:bg-sky-50 hover:text-sky-800"
              }`}
            >
              <Icon className="shrink-0" aria-hidden="true" />
              <span className="whitespace-nowrap lg:whitespace-normal">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
