"use client";

import { useEffect, useMemo, useState } from "react";
import { Users, Building2, BarChart3, RefreshCw, Plus, Pencil, Trash2, Ban, CheckCircle2, Shield, UserCog, User, TrendingUp, Clock, DollarSign, ChevronDown, ChevronUp, ImageIcon, ArrowLeft, ArrowRight, X, Search, AlertCircle, CheckCircle } from "lucide-react";

type UserRow = { id: string; vk_id: number; full_name: string; role: "host" | "guest" | "admin"; host_access_level: "basic" | "pro" | "extended"; is_blocked: boolean };
type VenueRow = { id: string; title: string; city: string; venue_type: string; capacity: number; is_active: boolean };
type VenuePhoto = { id: string; venue_id: string; photo_url: string; sort_order: number };
type AnalyticsData = {
  summary?: { users?: { hosts: number; admins: number; guests: number; total_users: number }; bookings?: { confirmed_hours: number; confirmed_revenue: number; confirmed_bookings: number } };
  venueStats?: { venue_id: string; bookings_count: number; revenue: number; hours: number } | null;
  userStats?: { user_id: string; owned_venues_count: number; bookings_as_guest_count: number; guest_spend: number } | null;
  inventoryUsage?: Array<{ inventory_name: string; usage_count: number; total_revenue: number }>;
  hourlyActivity?: Array<{ hour_of_day: number; bookings_count: number; total_revenue: number }>;
};

const EMPTY_VENUE_FORM = { ownerId: "", title: "", description: "", city: "Нижний Новгород", address: "", venueType: "loft", capacity: 10, rentalMode: "hourly", baseHourlyRate: 0, baseDailyRate: 0, minimumHours: 2, weekendMultiplier: 1, nightMultiplier: 1, cleaningFee: 0, discountPercent: 0, inventoryText: "", photoUrlsText: "" };
const EMPTY_USER_FORM = { vkId: "", fullName: "", phone: "", role: "guest", hostAccessLevel: "basic" };
const ROLE_COLORS: Record<string, string> = { admin: "bg-gradient-to-r from-rose-500 to-orange-500", host: "bg-gradient-to-r from-violet-500 to-purple-500", guest: "bg-gradient-to-r from-emerald-500 to-teal-500" };
const LEVEL_COLORS: Record<string, string> = { basic: "bg-slate-500/20 text-slate-300 border-slate-500/30", pro: "bg-amber-500/20 text-amber-300 border-amber-500/30", extended: "bg-rose-500/20 text-rose-300 border-rose-500/30" };

function StatCard({ icon: Icon, label, value, color, delay = 0 }: { icon: React.ElementType; label: string; value: string | number; color: string; delay?: number }) {
  return (
    <div className="glass-strong rounded-2xl p-5 shadow-glow hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 animate-slideUp" style={{ animationDelay: `${delay}ms`, animationFillMode: "both" }}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center shadow-lg`}><Icon className="w-5 h-5 text-white" /></div>
        <span className="text-sm text-white/60 font-medium">{label}</span>
      </div>
      <div className="text-2xl font-bold text-white tracking-tight">{value}</div>
    </div>
  );
}

function SectionCard({ title, icon: Icon, children, delay = 0 }: { title: string; icon: React.ElementType; children: React.ReactNode; delay?: number }) {
  return (
    <div className="glass rounded-2xl p-6 animate-slideUp" style={{ animationDelay: `${delay}ms`, animationFillMode: "both" }}>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center"><Icon className="w-4 h-4 text-white/80" /></div>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Badge({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${className}`}>{children}</span>;
}

function GlassInput({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <div className="space-y-1.5">
      {label && <label className="text-xs font-medium text-white/50 uppercase tracking-wider">{label}</label>}
      <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all" {...props} />
    </div>
  );
}

function GlassSelect({ label, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  return (
    <div className="space-y-1.5">
      {label && <label className="text-xs font-medium text-white/50 uppercase tracking-wider">{label}</label>}
      <select className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all appearance-none" {...props} />
    </div>
  );
}

function GlassButton({ children, variant = "primary", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "danger" | "ghost" }) {
  const variants = {
    primary: "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-glow hover:shadow-2xl hover:scale-[1.02]",
    secondary: "bg-white/10 text-white border border-white/20 hover:bg-white/20 hover:scale-[1.02]",
    danger: "bg-gradient-to-r from-rose-500 to-red-500 text-white shadow-glow hover:shadow-2xl hover:scale-[1.02]",
    ghost: "text-white/60 hover:text-white hover:bg-white/5",
  };
  return <button className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 active:scale-95 ${variants[variant]} ${props.className || ""}`} {...props}>{children}</button>;
}

function Accordion({ title, icon: Icon, isOpen, onToggle, children }: { title: string; icon: React.ElementType; isOpen: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <div className="glass rounded-2xl overflow-hidden animate-slideUp">
      <button onClick={onToggle} className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center"><Icon className="w-4 h-4 text-white/80" /></div>
          <span className="text-lg font-semibold text-white">{title}</span>
        </div>
        {isOpen ? <ChevronUp className="w-5 h-5 text-white/60" /> : <ChevronDown className="w-5 h-5 text-white/60" />}
      </button>
      {isOpen && <div className="px-5 pb-5 border-t border-white/10">{children}</div>}
    </div>
  );
}

function AnalyticsPanel({ data, delay = 0 }: { data: AnalyticsData | null; delay?: number }) {
  if (!data) return null;
  const users = data.summary?.users;
  const bookings = data.summary?.bookings;
  const maxHourly = Math.max(...(data.hourlyActivity?.map((h) => h.bookings_count) || [1]));

  return (
    <div className="space-y-6 animate-slideUp" style={{ animationDelay: `${delay}ms`, animationFillMode: "both" }}>
      {(users || bookings) && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {users && (<>
            <StatCard icon={Users} label="Всего пользователей" value={users.total_users} color="bg-blue-500" delay={delay + 50} />
            <StatCard icon={UserCog} label="Арендодателей" value={users.hosts} color="bg-violet-500" delay={delay + 100} />
            <StatCard icon={User} label="Гостей" value={users.guests} color="bg-emerald-500" delay={delay + 150} />
            <StatCard icon={Shield} label="Админов" value={users.admins} color="bg-rose-500" delay={delay + 200} />
          </>)}
          {bookings && (<>
            <StatCard icon={CheckCircle2} label="Бронирований" value={bookings.confirmed_bookings} color="bg-teal-500" delay={delay + 250} />
            <StatCard icon={DollarSign} label="Выручка" value={`${bookings.confirmed_revenue.toLocaleString()} ₽`} color="bg-amber-500" delay={delay + 300} />
            <StatCard icon={Clock} label="Часов аренды" value={bookings.confirmed_hours} color="bg-cyan-500" delay={delay + 350} />
            <StatCard icon={TrendingUp} label="Средний чек" value={bookings.confirmed_bookings > 0 ? `${Math.round(bookings.confirmed_revenue / bookings.confirmed_bookings).toLocaleString()} ₽` : "0 ₽"} color="bg-pink-500" delay={delay + 400} />
          </>)}
        </div>
      )}
      {(data.venueStats || data.userStats) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.venueStats && (
            <div className="glass-strong rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-white/70 mb-4 uppercase tracking-wider">Аналитика площадки</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center"><span className="text-white/60">Бронирований</span><span className="text-white font-semibold">{data.venueStats.bookings_count}</span></div>
                <div className="flex justify-between items-center"><span className="text-white/60">Выручка</span><span className="text-emerald-400 font-semibold">{data.venueStats.revenue.toLocaleString()} ₽</span></div>
                <div className="flex justify-between items-center"><span className="text-white/60">Часов аренды</span><span className="text-white font-semibold">{data.venueStats.hours}</span></div>
              </div>
            </div>
          )}
          {data.userStats && (
            <div className="glass-strong rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-white/70 mb-4 uppercase tracking-wider">Аналитика пользователя</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center"><span className="text-white/60">Площадок</span><span className="text-white font-semibold">{data.userStats.owned_venues_count}</span></div>
                <div className="flex justify-between items-center"><span className="text-white/60">Бронирований</span><span className="text-white font-semibold">{data.userStats.bookings_as_guest_count}</span></div>
                <div className="flex justify-between items-center"><span className="text-white/60">Потратил</span><span className="text-emerald-400 font-semibold">{data.userStats.guest_spend.toLocaleString()} ₽</span></div>
              </div>
            </div>
          )}
        </div>
      )}
      {data.hourlyActivity && data.hourlyActivity.length > 0 && (
        <div className="glass rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white/70 mb-4 uppercase tracking-wider">Активность по часам</h3>
          <div className="flex items-end gap-1 h-32">
            {data.hourlyActivity.map((hour) => (
              <div key={hour.hour_of_day} className="flex-1 flex flex-col items-center gap-1 group">
                <div className="relative w-full">
                  <div className="w-full bg-gradient-to-t from-indigo-500/40 to-purple-500/80 rounded-t-md transition-all duration-300 group-hover:from-indigo-400 group-hover:to-purple-400" style={{ height: `${(hour.bookings_count / maxHourly) * 100}px`, minHeight: 4 }} />
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">{hour.bookings_count} броней</div>
                </div>
                <span className="text-[10px] text-white/40">{hour.hour_of_day}ч</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {data.inventoryUsage && data.inventoryUsage.length > 0 && (
        <div className="glass rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white/70 mb-4 uppercase tracking-wider">Использование инвентаря</h3>
          <div className="space-y-3">
            {data.inventoryUsage.map((item) => (
              <div key={item.inventory_name} className="space-y-1">
                <div className="flex justify-between text-sm"><span className="text-white/70">{item.inventory_name}</span><span className="text-white/50">{item.usage_count} использований · {item.total_revenue.toLocaleString()} ₽</span></div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" style={{ width: `${Math.min((item.usage_count / (data.inventoryUsage?.[0]?.usage_count || 1)) * 100, 100)}%` }} /></div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function AdminDashboard() {
  const [vkId, setVkId] = useState("1703478");
  const [users, setUsers] = useState<UserRow[]>([]);
  const [venues, setVenues] = useState<VenueRow[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [venuePhotos, setVenuePhotos] = useState<VenuePhoto[]>([]);
  const [searchUser, setSearchUser] = useState("");
  const [searchVenue, setSearchVenue] = useState("");
  const [venueForm, setVenueForm] = useState(EMPTY_VENUE_FORM);
  const [editingVenueId, setEditingVenueId] = useState<string | null>(null);
  const [userForm, setUserForm] = useState(EMPTY_USER_FORM);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [selectedVenueId, setSelectedVenueId] = useState<string>("");
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [openAccordion, setOpenAccordion] = useState<string | null>("analytics");

  const headers = useMemo(() => ({ "x-vk-id": vkId, "Content-Type": "application/json" }), [vkId]);

  async function loadAll() {
    setError(null);
    try {
      const analyticsPath = `/api/admin/analytics${selectedVenueId || selectedUserId ? "?" : ""}${selectedVenueId ? `venueId=${selectedVenueId}` : ""}${selectedVenueId && selectedUserId ? "&" : ""}${selectedUserId ? `userId=${selectedUserId}` : ""}`;
      const [usersRes, venuesRes, analyticsRes] = await Promise.all([
        fetch("/api/admin/users", { headers }), fetch("/api/admin/venues", { headers }), fetch(analyticsPath, { headers }),
      ]);
      if (!usersRes.ok || !venuesRes.ok || !analyticsRes.ok) throw new Error("Не удалось загрузить данные админки");
      const usersJson = await usersRes.json();
      const venuesJson = await venuesRes.json();
      const analyticsJson = await analyticsRes.json();
      setUsers(usersJson.users ?? []);
      setVenues(venuesJson.venues ?? []);
      setAnalytics(analyticsJson);
    } catch (e) { setError((e as Error).message); }
  }

  useEffect(() => { loadAll(); }, [selectedVenueId, selectedUserId]);

  const filteredUsers = users.filter((u) => u.full_name.toLowerCase().includes(searchUser.toLowerCase()) || String(u.vk_id).includes(searchUser));
  const filteredVenues = venues.filter((v) => v.title.toLowerCase().includes(searchVenue.toLowerCase()) || v.city.toLowerCase().includes(searchVenue.toLowerCase()));

  function parseInventory(text: string) {
    return text.split("\n").map((line) => line.trim()).filter(Boolean).map((line) => {
      const [name, price = "0", quantity = "1"] = line.split(";").map((s) => s.trim());
      return { name, unitPrice: Number(price), quantity: Number(quantity), included: false };
    });
  }
  function parsePhotoUrls(text: string) { return text.split("\n").map((s) => s.trim()).filter(Boolean); }

  async function loadVenuePhotos(venueId: string) {
    const res = await fetch(`/api/admin/venues/photos?venueId=${venueId}`, { headers });
    if (!res.ok) throw new Error("Не удалось загрузить фото площадки");
    const json = await res.json();
    setVenuePhotos(json.photos ?? []);
    setVenueForm((prev) => ({ ...prev, photoUrlsText: (json.photos ?? []).map((p: VenuePhoto) => p.photo_url).join("\n") }));
  }

  async function uploadPhoto(file: File) {
    if (!editingVenueId) { setError("Сначала сохраните площадку, затем загрузите фото"); return; }
    setIsUploadingPhoto(true); setError(null);
    try {
      const formData = new FormData();
      formData.append("venueId", editingVenueId); formData.append("file", file);
      const res = await fetch("/api/admin/venues/photos", { method: "POST", headers: { "x-vk-id": vkId }, body: formData });
      if (!res.ok) throw new Error("Ошибка загрузки фото");
      const json = await res.json();
      const uploadedPhoto = json.photo as VenuePhoto;
      const next = [...venuePhotos, uploadedPhoto].sort((a, b) => a.sort_order - b.sort_order);
      setVenuePhotos(next);
      setVenueForm((prev) => ({ ...prev, photoUrlsText: next.map((p) => p.photo_url).join("\n") }));
      setSuccess("Фото загружено");
    } catch (e) { setError((e as Error).message); } finally { setIsUploadingPhoto(false); }
  }

  async function submitVenueForm() {
    setSuccess(null);
    if (!venueForm.ownerId || !venueForm.title) { setError("Для площадки обязательны ownerId и название"); return; }
    const payload = { ownerId: venueForm.ownerId, title: venueForm.title, description: venueForm.description, city: venueForm.city, address: venueForm.address, venueType: venueForm.venueType, capacity: Number(venueForm.capacity), discountPercent: Number(venueForm.discountPercent), inventory: parseInventory(venueForm.inventoryText), photos: parsePhotoUrls(venueForm.photoUrlsText), pricing: { rentalMode: venueForm.rentalMode, baseHourlyRate: Number(venueForm.baseHourlyRate), baseDailyRate: Number(venueForm.baseDailyRate), minimumHours: Number(venueForm.minimumHours), weekendMultiplier: Number(venueForm.weekendMultiplier), nightMultiplier: Number(venueForm.nightMultiplier), cleaningFee: Number(venueForm.cleaningFee) } };
    if (editingVenueId) {
      await fetch("/api/admin/venues", { method: "PATCH", headers, body: JSON.stringify({ venueId: editingVenueId, venuePatch: { title: payload.title, description: payload.description, city: payload.city, address: payload.address, venue_type: payload.venueType, capacity: payload.capacity }, pricingPatch: { base_hourly_rate: payload.pricing.baseHourlyRate, base_daily_rate: payload.pricing.baseDailyRate, minimum_hours: payload.pricing.minimumHours, weekend_multiplier: payload.pricing.weekendMultiplier, night_multiplier: payload.pricing.nightMultiplier, cleaning_fee: payload.pricing.cleaningFee }, discountPercent: payload.discountPercent, inventory: payload.inventory, photos: payload.photos }) });
    } else {
      await fetch("/api/admin/venues", { method: "POST", headers, body: JSON.stringify(payload) });
    }
    setVenueForm(EMPTY_VENUE_FORM); setVenuePhotos([]); setSuccess(editingVenueId ? "Площадка обновлена" : "Площадка создана"); setEditingVenueId(null); await loadAll();
  }

  async function submitUserForm() {
    setSuccess(null);
    if (!userForm.vkId || !userForm.fullName) { setError("Для пользователя обязательны VK ID и ФИО"); return; }
    const payload = { vkId: Number(userForm.vkId), fullName: userForm.fullName, phone: userForm.phone, role: userForm.role, hostAccessLevel: userForm.hostAccessLevel };
    if (editingUserId) {
      await fetch("/api/admin/users", { method: "PATCH", headers, body: JSON.stringify({ userId: editingUserId, patch: { full_name: payload.fullName, phone: payload.phone, role: payload.role, host_access_level: payload.hostAccessLevel } }) });
    } else {
      await fetch("/api/admin/users", { method: "POST", headers, body: JSON.stringify(payload) });
    }
    setUserForm(EMPTY_USER_FORM); setSuccess(editingUserId ? "Пользователь обновлён" : "Пользователь создан"); setEditingUserId(null); await loadAll();
  }

  async function startEditVenue(venue: VenueRow) {
    setEditingVenueId(venue.id);
    setVenueForm((prev) => ({ ...prev, ownerId: "", title: venue.title, city: venue.city, venueType: venue.venue_type, capacity: venue.capacity }));
    await loadVenuePhotos(venue.id); setOpenAccordion("venue");
  }

  function startEditUser(user: UserRow) {
    setEditingUserId(user.id);
    setUserForm({ vkId: String(user.vk_id), fullName: user.full_name, phone: "", role: user.role, hostAccessLevel: user.host_access_level });
    setOpenAccordion("user");
  }

  async function toggleUserBlock(user: UserRow) {
    await fetch("/api/admin/users", { method: "PATCH", headers, body: JSON.stringify({ userId: user.id, patch: { is_blocked: !user.is_blocked } }) });
    await loadAll();
  }

  async function deleteUser(userId: string) { if (!confirm("Удалить пользователя?")) return; await fetch(`/api/admin/users?userId=${userId}`, { method: "DELETE", headers }); await loadAll(); }
  async function deleteVenue(venueId: string) { if (!confirm("Удалить площадку?")) return; await fetch(`/api/admin/venues?venueId=${venueId}`, { method: "DELETE", headers }); await loadAll(); }

  async function savePhotoOrder(nextPhotos: VenuePhoto[]) {
    if (!editingVenueId) return;
    await fetch("/api/admin/venues/photos", { method: "PATCH", headers, body: JSON.stringify({ venueId: editingVenueId, orderedPhotoIds: nextPhotos.map((p) => p.id) }) });
  }

  async function movePhoto(photoId: string, direction: "left" | "right") {
    const index = venuePhotos.findIndex((p) => p.id === photoId);
    if (index < 0) return;
    const targetIndex = direction === "left" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= venuePhotos.length) return;
    const next = [...venuePhotos];
    const [item] = next.splice(index, 1);
    next.splice(targetIndex, 0, item);
    setVenuePhotos(next);
    setVenueForm((prev) => ({ ...prev, photoUrlsText: next.map((p) => p.photo_url).join("\n") }));
    await savePhotoOrder(next);
  }

  async function deletePhoto(photoId: string) {
    if (!editingVenueId) return;
    await fetch(`/api/admin/venues/photos?venueId=${editingVenueId}&photoId=${photoId}`, { method: "DELETE", headers });
    const next = venuePhotos.filter((p) => p.id !== photoId);
    setVenuePhotos(next);
    setVenueForm((prev) => ({ ...prev, photoUrlsText: next.map((p) => p.photo_url).join("\n") }));
    await savePhotoOrder(next);
  }

  return (
    <div className="min-h-screen bg-gradient-mesh p-4 md:p-8">
      <div className="fixed top-20 left-10 w-72 h-72 bg-purple-500/20 rounded-full blur-[100px] animate-float pointer-events-none" />
      <div className="fixed bottom-20 right-10 w-96 h-96 bg-pink-500/15 rounded-full blur-[120px] animate-float pointer-events-none" style={{ animationDelay: "2s" }} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[150px] animate-float pointer-events-none" style={{ animationDelay: "4s" }} />

      <div className="relative z-10 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-slideUp">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-gradient tracking-tight">Админ-панель</h1>
            <p className="text-white/50 text-sm mt-1">Управление площадками и пользователями</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="glass rounded-xl px-4 py-2 flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-400" />
              <span className="text-sm text-white/70">VK ID:</span>
              <input value={vkId} onChange={(e) => setVkId(e.target.value)} className="bg-transparent text-sm text-white w-24 focus:outline-none font-mono" />
            </div>
            <GlassButton onClick={loadAll} variant="secondary" className="!px-3"><RefreshCw className="w-4 h-4" /></GlassButton>
          </div>
        </div>

        {error && (
          <div className="glass rounded-xl p-4 border border-rose-500/30 bg-rose-500/10 flex items-center gap-3 animate-scaleIn">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" /><p className="text-rose-200 text-sm">{error}</p>
            <button onClick={() => setError(null)} className="ml-auto text-rose-400/60 hover:text-rose-400"><X className="w-4 h-4" /></button>
          </div>
        )}
        {success && (
          <div className="glass rounded-xl p-4 border border-emerald-500/30 bg-emerald-500/10 flex items-center gap-3 animate-scaleIn">
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" /><p className="text-emerald-200 text-sm">{success}</p>
            <button onClick={() => setSuccess(null)} className="ml-auto text-emerald-400/60 hover:text-emerald-400"><X className="w-4 h-4" /></button>
          </div>
        )}

        <Accordion title="Аналитика и статистика" icon={BarChart3} isOpen={openAccordion === "analytics"} onToggle={() => setOpenAccordion(openAccordion === "analytics" ? null : "analytics")}>
          <div className="space-y-4 pt-2">
            <div className="flex flex-wrap gap-3">
              <GlassSelect label="Фильтр по площадке" value={selectedVenueId} onChange={(e) => setSelectedVenueId(e.target.value)}>
                <option value="">Все площадки</option>
                {venues.map((v) => <option key={v.id} value={v.id}>{v.title}</option>)}
              </GlassSelect>
              <GlassSelect label="Фильтр по пользователю" value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)}>
                <option value="">Все пользователи</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.full_name}</option>)}
              </GlassSelect>
            </div>
            <AnalyticsPanel data={analytics} delay={100} />
          </div>
        </Accordion>

        <Accordion title={`${editingVenueId ? "Редактирование" : "Создание"} площадки`} icon={Building2} isOpen={openAccordion === "venue"} onToggle={() => setOpenAccordion(openAccordion === "venue" ? null : "venue")}>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <GlassInput label="Владелец (ID)" placeholder="UUID пользователя" value={venueForm.ownerId} onChange={(e) => setVenueForm({ ...venueForm, ownerId: e.target.value })} />
              <GlassInput label="Название" placeholder="Название площадки" value={venueForm.title} onChange={(e) => setVenueForm({ ...venueForm, title: e.target.value })} />
              <GlassInput label="Город" value={venueForm.city} onChange={(e) => setVenueForm({ ...venueForm, city: e.target.value })} />
              <GlassInput label="Адрес" placeholder="Улица, дом" value={venueForm.address} onChange={(e) => setVenueForm({ ...venueForm, address: e.target.value })} />
              <GlassSelect label="Тип" value={venueForm.venueType} onChange={(e) => setVenueForm({ ...venueForm, venueType: e.target.value })}>
                <option value="loft">Лофт</option><option value="studio">Студия</option><option value="hall">Зал</option><option value="outdoor">На открытом воздухе</option>
              </GlassSelect>
              <GlassInput label="Вместимость" type="number" value={venueForm.capacity} onChange={(e) => setVenueForm({ ...venueForm, capacity: Number(e.target.value) })} />
              <GlassInput label="Цена за час" type="number" value={venueForm.baseHourlyRate} onChange={(e) => setVenueForm({ ...venueForm, baseHourlyRate: Number(e.target.value) })} />
              <GlassInput label="Цена за день" type="number" value={venueForm.baseDailyRate} onChange={(e) => setVenueForm({ ...venueForm, baseDailyRate: Number(e.target.value) })} />
              <GlassInput label="Мин. часов" type="number" value={venueForm.minimumHours} onChange={(e) => setVenueForm({ ...venueForm, minimumHours: Number(e.target.value) })} />
              <GlassInput label="Скидка %" type="number" value={venueForm.discountPercent} onChange={(e) => setVenueForm({ ...venueForm, discountPercent: Number(e.target.value) })} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/50 uppercase tracking-wider">Описание</label>
              <textarea className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all min-h-[80px] resize-y" placeholder="Описание площадки..." value={venueForm.description} onChange={(e) => setVenueForm({ ...venueForm, description: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/50 uppercase tracking-wider">Инвентарь (название;цена;кол-во)</label>
              <textarea className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all min-h-[60px] resize-y font-mono text-xs" placeholder="Проектор;500;1&#10;Микрофон;300;2" value={venueForm.inventoryText} onChange={(e) => setVenueForm({ ...venueForm, inventoryText: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/50 uppercase tracking-wider">Фото (URL по строкам)</label>
              <textarea className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all min-h-[60px] resize-y font-mono text-xs" placeholder="https://..." value={venueForm.photoUrlsText} onChange={(e) => setVenueForm({ ...venueForm, photoUrlsText: e.target.value })} />
            </div>
            <div className="flex items-center gap-4">
              <label className="glass px-4 py-2.5 rounded-xl text-sm text-white/70 cursor-pointer hover:bg-white/10 transition-colors flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />{isUploadingPhoto ? "Загрузка..." : "Загрузить фото"}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) uploadPhoto(file); }} />
              </label>
            </div>
            {editingVenueId && venuePhotos.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {venuePhotos.map((photo, index) => (
                  <div key={photo.id} className="glass rounded-xl overflow-hidden group">
                    <img src={photo.photo_url} alt="" className="w-full h-24 object-cover" />
                    <div className="p-2 flex items-center justify-between">
                      <div className="flex gap-1">
                        <button onClick={() => movePhoto(photo.id, "left")} disabled={index === 0} className="p-1 rounded hover:bg-white/10 disabled:opacity-30 transition-colors"><ArrowLeft className="w-3 h-3 text-white/60" /></button>
                        <button onClick={() => movePhoto(photo.id, "right")} disabled={index === venuePhotos.length - 1} className="p-1 rounded hover:bg-white/10 disabled:opacity-30 transition-colors"><ArrowRight className="w-3 h-3 text-white/60" /></button>
                      </div>
                      <button onClick={() => deletePhoto(photo.id)} className="p-1 rounded hover:bg-rose-500/20 transition-colors"><Trash2 className="w-3 h-3 text-rose-400" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <GlassButton onClick={submitVenueForm}><Plus className="w-4 h-4 inline mr-2" />{editingVenueId ? "Сохранить изменения" : "Создать площадку"}</GlassButton>
              {editingVenueId && <GlassButton variant="ghost" onClick={() => { setEditingVenueId(null); setVenueForm(EMPTY_VENUE_FORM); setVenuePhotos([]); }}>Отменить</GlassButton>}
            </div>
          </div>
        </Accordion>

        <Accordion title={`${editingUserId ? "Редактирование" : "Создание"} пользователя`} icon={Users} isOpen={openAccordion === "user"} onToggle={() => setOpenAccordion(openAccordion === "user" ? null : "user")}>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <GlassInput label="VK ID" placeholder="12345678" value={userForm.vkId} onChange={(e) => setUserForm({ ...userForm, vkId: e.target.value })} />
              <GlassInput label="ФИО" placeholder="Иванов Иван" value={userForm.fullName} onChange={(e) => setUserForm({ ...userForm, fullName: e.target.value })} />
              <GlassInput label="Телефон" placeholder="+7..." value={userForm.phone} onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })} />
              <GlassSelect label="Роль" value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}>
                <option value="guest">Гость</option><option value="host">Арендодатель</option><option value="admin">Администратор</option>
              </GlassSelect>
              <GlassSelect label="Уровень доступа" value={userForm.hostAccessLevel} onChange={(e) => setUserForm({ ...userForm, hostAccessLevel: e.target.value })}>
                <option value="basic">Basic</option><option value="pro">Pro</option><option value="extended">Extended</option>
              </GlassSelect>
            </div>
            <div className="flex gap-3 pt-2">
              <GlassButton onClick={submitUserForm}><Plus className="w-4 h-4 inline mr-2" />{editingUserId ? "Сохранить изменения" : "Создать пользователя"}</GlassButton>
              {editingUserId && <GlassButton variant="ghost" onClick={() => { setEditingUserId(null); setUserForm(EMPTY_USER_FORM); }}>Отменить</GlassButton>}
            </div>
          </div>
        </Accordion>

        <SectionCard title={`Площадки (${venues.length})`} icon={Building2} delay={200}>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input type="text" placeholder="Поиск по названию или городу..." value={searchVenue} onChange={(e) => setSearchVenue(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-white/50 uppercase tracking-wider">Название</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-white/50 uppercase tracking-wider">Город</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-white/50 uppercase tracking-wider">Тип</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-white/50 uppercase tracking-wider">Вместимость</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-white/50 uppercase tracking-wider">Статус</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-white/50 uppercase tracking-wider">Действия</th>
                </tr>
              </thead>
              <tbody>
                {filteredVenues.map((venue) => (
                  <tr key={venue.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                    <td className="py-3 px-4 text-sm text-white font-medium">{venue.title}</td>
                    <td className="py-3 px-4 text-sm text-white/70">{venue.city}</td>
                    <td className="py-3 px-4"><Badge className="bg-white/10 text-white/70 border-white/20 capitalize">{venue.venue_type}</Badge></td>
                    <td className="py-3 px-4 text-sm text-white/70">{venue.capacity} чел.</td>
                    <td className="py-3 px-4"><Badge className={venue.is_active ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" : "bg-amber-500/20 text-amber-300 border-amber-500/30"}>{venue.is_active ? "Активна" : "На модерации"}</Badge></td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => startEditVenue(venue)} className="p-2 rounded-lg hover:bg-white/10 transition-colors"><Pencil className="w-4 h-4 text-white/70" /></button>
                        <button onClick={() => deleteVenue(venue.id)} className="p-2 rounded-lg hover:bg-rose-500/20 transition-colors"><Trash2 className="w-4 h-4 text-rose-400" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredVenues.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-white/40 text-sm">{searchVenue ? "Ничего не найдено" : "Пока нет площадок"}</td></tr>}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <SectionCard title={`Пользователи (${users.length})`} icon={Users} delay={300}>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input type="text" placeholder="Поиск по имени или VK ID..." value={searchUser} onChange={(e) => setSearchUser(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-white/50 uppercase tracking-wider">Имя</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-white/50 uppercase tracking-wider">VK ID</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-white/50 uppercase tracking-wider">Роль</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-white/50 uppercase tracking-wider">Уровень</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-white/50 uppercase tracking-wider">Статус</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-white/50 uppercase tracking-wider">Действия</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                    <td className="py-3 px-4 text-sm text-white font-medium">{user.full_name}</td>
                    <td className="py-3 px-4 text-sm text-white/50 font-mono">{user.vk_id}</td>
                    <td className="py-3 px-4"><Badge className={`${ROLE_COLORS[user.role]} text-white border-transparent shadow-lg`}>{user.role === "admin" ? "Админ" : user.role === "host" ? "Арендодатель" : "Гость"}</Badge></td>
                    <td className="py-3 px-4"><Badge className={LEVEL_COLORS[user.host_access_level]}>{user.host_access_level.toUpperCase()}</Badge></td>
                    <td className="py-3 px-4">
                      {user.is_blocked ? <Badge className="bg-rose-500/20 text-rose-300 border-rose-500/30"><Ban className="w-3 h-3 inline mr-1" />Заблокирован</Badge> : <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30"><CheckCircle2 className="w-3 h-3 inline mr-1" />Активен</Badge>}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => startEditUser(user)} className="p-2 rounded-lg hover:bg-white/10 transition-colors"><Pencil className="w-4 h-4 text-white/70" /></button>
                        <button onClick={() => toggleUserBlock(user)} className="p-2 rounded-lg hover:bg-amber-500/20 transition-colors"><Ban className="w-4 h-4 text-amber-400" /></button>
                        <button onClick={() => deleteUser(user.id)} className="p-2 rounded-lg hover:bg-rose-500/20 transition-colors"><Trash2 className="w-4 h-4 text-rose-400" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-white/40 text-sm">{searchUser ? "Ничего не найдено" : "Пока нет пользователей"}</td></tr>}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <div className="text-center text-white/30 text-xs py-8 animate-slideUp" style={{ animationDelay: "400ms", animationFillMode: "both" }}>Bronirovanei ANO · Admin Panel v2026</div>
      </div>
    </div>
  );
}
