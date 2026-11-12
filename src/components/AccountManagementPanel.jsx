import { useCallback, useEffect, useMemo, useState } from "react";
import { FaEdit, FaPlus, FaTrash } from "react-icons/fa";
import { supabase } from "../lib/supabase";

const ROLES = [
  { value: "professor", label: "Docente" },
  { value: "support", label: "Soporte" },
  { value: "admin", label: "Administrador" },
];

const EMPTY_FORM = { email: "", name: "", role: "professor" };
const normalizeSearch = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .trim();

export default function AccountManagementPanel({ adminEmail }) {
  const [accounts, setAccounts] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingEmail, setEditingEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState({ text: "", type: "" });
  const [accountSearch, setAccountSearch] = useState("");

  const loadAccounts = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    const { data, error } = await supabase.rpc("list_demo_accounts", {
      p_actor_email: adminEmail,
    });
    if (error) {
      setNotice({
        text: `No se pudieron cargar las cuentas: ${error.message}`,
        type: "error",
      });
    } else {
      setAccounts(data || []);
    }
    setLoading(false);
  }, [adminEmail]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const filteredAccounts = useMemo(() => {
    const query = normalizeSearch(accountSearch);
    return query
      ? accounts.filter((account) =>
          normalizeSearch(`${account.name} ${account.email}`).includes(query),
        )
      : accounts;
  }, [accounts, accountSearch]);

  const resetForm = () => {
    setEditingEmail("");
    setForm(EMPTY_FORM);
  };

  const saveAccount = async (event) => {
    event.preventDefault();
    setSaving(true);
    setNotice({ text: "", type: "" });
    const { error } = await supabase.rpc("save_demo_account", {
      p_actor_email: adminEmail,
      p_original_email: editingEmail || null,
      p_email: form.email.trim().toLocaleLowerCase(),
      p_name: form.name.trim(),
      p_role: form.role,
    });
    setSaving(false);
    if (error) {
      setNotice({
        text: `No se pudo guardar la cuenta: ${error.message}`,
        type: "error",
      });
      return;
    }
    setNotice({
      text: editingEmail ? "Cuenta actualizada." : "Cuenta creada.",
      type: "success",
    });
    resetForm();
    await loadAccounts();
  };

  const editAccount = (account) => {
    setEditingEmail(account.email);
    setForm({ email: account.email, name: account.name, role: account.role });
    setNotice({ text: "", type: "" });
  };

  const deleteAccount = async (account) => {
    if (
      !window.confirm(`¿Eliminar la cuenta ${account.name} (${account.email})?`)
    )
      return;
    setNotice({ text: "", type: "" });
    const { error } = await supabase.rpc("delete_demo_account", {
      p_actor_email: adminEmail,
      p_email: account.email,
    });
    if (error) {
      setNotice({
        text: `No se pudo eliminar la cuenta: ${error.message}`,
        type: "error",
      });
      return;
    }
    if (editingEmail === account.email) resetForm();
    setNotice({ text: "Cuenta eliminada.", type: "success" });
    await loadAccounts();
  };

  return (
    <section className="space-y-6">
      <header className="border-b border-slate-200 pb-5">
        <p className="text-xs font-bold uppercase tracking-wider text-sky-700">
          Administración
        </p>
        <h2 className="mt-1 text-2xl font-bold text-slate-900">
          Cuentas y roles
        </h2>
      </header>

      <form
        onSubmit={saveAccount}
        className="grid gap-4 border-b border-slate-200 pb-6 sm:grid-cols-2 lg:grid-cols-4"
      >
        <label className="text-sm font-medium text-slate-700">
          Nombre
          <input
            required
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            placeholder="Nombre completo"
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Correo
          <input
            required
            type="email"
            value={form.email}
            onChange={(event) =>
              setForm({ ...form, email: event.target.value })
            }
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            placeholder="persona@correo.com"
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Rol
          <select
            value={form.role}
            onChange={(event) => setForm({ ...form, role: event.target.value })}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
          >
            {ROLES.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-end gap-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-sky-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-800 disabled:opacity-60"
          >
            {editingEmail ? (
              <FaEdit aria-hidden="true" />
            ) : (
              <FaPlus aria-hidden="true" />
            )}
            {saving
              ? "Guardando…"
              : editingEmail
                ? "Guardar cambios"
                : "Crear cuenta"}
          </button>
          {editingEmail && (
            <button
              type="button"
              onClick={resetForm}
              className="min-h-10 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      {notice.text && (
        <p
          role="status"
          className={`rounded-lg px-4 py-3 text-sm ${notice.type === "error" ? "bg-rose-50 text-rose-800" : "bg-emerald-50 text-emerald-800"}`}
        >
          {notice.text}
        </p>
      )}

      <label className="block max-w-xl text-xs font-semibold uppercase tracking-wide text-slate-500">
        Buscar cuenta por nombre o correo
        <input
          type="search"
          value={accountSearch}
          onChange={(event) => setAccountSearch(event.target.value)}
          placeholder="Nombre o correo"
          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal normal-case text-slate-800 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
        />
      </label>

      <div className="overflow-x-auto">
        <table className="w-full min-w-160 border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
              <th className="px-3 py-3 font-semibold">Nombre</th>
              <th className="px-3 py-3 font-semibold">Correo</th>
              <th className="px-3 py-3 font-semibold">Rol</th>
              <th className="px-3 py-3 text-right font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredAccounts.map((account) => (
              <tr
                key={account.email}
                className="border-b border-slate-100 last:border-0"
              >
                <td className="px-3 py-3 font-medium text-slate-900">
                  {account.name}
                </td>
                <td className="px-3 py-3 text-slate-600">{account.email}</td>
                <td className="px-3 py-3 text-slate-600">
                  {ROLES.find((role) => role.value === account.role)?.label ||
                    account.role}
                </td>
                <td className="px-3 py-3">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      title={`Editar ${account.name}`}
                      aria-label={`Editar ${account.name}`}
                      onClick={() => editAccount(account)}
                      className="rounded-md p-2 text-sky-700 hover:bg-sky-50"
                    >
                      <FaEdit aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      title={`Eliminar ${account.name}`}
                      aria-label={`Eliminar ${account.name}`}
                      onClick={() => deleteAccount(account)}
                      className="rounded-md p-2 text-rose-700 hover:bg-rose-50"
                    >
                      <FaTrash aria-hidden="true" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && filteredAccounts.length === 0 && (
              <tr>
                <td
                  colSpan="4"
                  className="px-3 py-8 text-center text-slate-500"
                >
                  {accounts.length === 0
                    ? "No hay cuentas registradas."
                    : "No hay cuentas que coincidan con la búsqueda."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {loading && <p className="text-sm text-slate-500">Cargando cuentas…</p>}
    </section>
  );
}
