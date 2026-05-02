"use client";

import { useEffect, useMemo, useState } from "react";

type UserRow = {
  id: string;
  vk_id: number;
  full_name: string;
  role: "host" | "guest" | "admin";
  host_access_level: "basic" | "pro" | "extended";
  is_blocked: boolean;
};

type VenueRow = {
  id: string;
  title: string;
  city: string;
  venue_type: string;
  capacity: number;
  is_active: boolean;
};

type VenuePhoto = {
  id: string;
  venue_id: string;
  photo_url: string;
  sort_order: number;
};

const EMPTY_VENUE_FORM = {
  ownerId: "",
  title: "",
  description: "",
  city: "Нижний Новгород",
  address: "",
  venueType: "loft",
  capacity: 10,
  rentalMode: "hourly",
  baseHourlyRate: 0,
  baseDailyRate: 0,
  minimumHours: 2,
  weekendMultiplier: 1,
  nightMultiplier: 1,
  cleaningFee: 0,
  discountPercent: 0,
  inventoryText: "",
  photoUrlsText: "",
};

const EMPTY_USER_FORM = {
  vkId: "",
  fullName: "",
  phone: "",
  role: "guest",
  hostAccessLevel: "basic",
};

export function AdminDashboard() {
  const [vkId, setVkId] = useState("1703478");
  const [users, setUsers] = useState<UserRow[]>([]);
  const [venues, setVenues] = useState<VenueRow[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [venuePhotos, setVenuePhotos] = useState<VenuePhoto[]>([]);

  const [venueForm, setVenueForm] = useState(EMPTY_VENUE_FORM);
  const [editingVenueId, setEditingVenueId] = useState<string | null>(null);

  const [userForm, setUserForm] = useState(EMPTY_USER_FORM);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  const [selectedVenueId, setSelectedVenueId] = useState<string>("");
  const [selectedUserId, setSelectedUserId] = useState<string>("");

  const headers = useMemo(() => ({ "x-vk-id": vkId, "Content-Type": "application/json" }), [vkId]);

  async function loadAll() {
    setError(null);
    try {
      const analyticsPath = `/api/admin/analytics${selectedVenueId || selectedUserId ? "?" : ""}${selectedVenueId ? `venueId=${selectedVenueId}` : ""}${selectedVenueId && selectedUserId ? "&" : ""}${selectedUserId ? `userId=${selectedUserId}` : ""}`;
      const [usersRes, venuesRes, analyticsRes] = await Promise.all([
        fetch("/api/admin/users", { headers }),
        fetch("/api/admin/venues", { headers }),
        fetch(analyticsPath, { headers }),
      ]);

      if (!usersRes.ok || !venuesRes.ok || !analyticsRes.ok) {
        throw new Error("Не удалось загрузить данные админки");
      }

      const usersJson = await usersRes.json();
      const venuesJson = await venuesRes.json();
      const analyticsJson = await analyticsRes.json();

      setUsers(usersJson.users ?? []);
      setVenues(venuesJson.venues ?? []);
      setAnalytics(analyticsJson);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  useEffect(() => {
    loadAll();
  }, [selectedVenueId, selectedUserId]);

  function parseInventory(text: string) {
    return text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [name, price = "0", quantity = "1"] = line.split(";").map((s) => s.trim());
        return { name, unitPrice: Number(price), quantity: Number(quantity), included: false };
      });
  }

  function parsePhotoUrls(text: string) {
    return text.split("\n").map((s) => s.trim()).filter(Boolean);
  }



  async function loadVenuePhotos(venueId: string) {
    const res = await fetch(`/api/admin/venues/photos?venueId=${venueId}`, { headers });
    if (!res.ok) throw new Error("Не удалось загрузить фото площадки");
    const json = await res.json();
    setVenuePhotos(json.photos ?? []);
    setVenueForm((prev) => ({
      ...prev,
      photoUrlsText: (json.photos ?? []).map((p: VenuePhoto) => p.photo_url).join("\n"),
    }));
  }

  async function uploadPhoto(file: File) {
    if (!editingVenueId) {
      setError("Сначала сохраните площадку, затем загрузите фото");
      return;
    }

    setIsUploadingPhoto(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("venueId", editingVenueId);
      formData.append("file", file);

      const res = await fetch("/api/admin/venues/photos", {
        method: "POST",
        headers: { "x-vk-id": vkId },
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Ошибка загрузки фото");
      }

      const json = await res.json();
      const uploadedPhoto = json.photo as VenuePhoto;
      const next = [...venuePhotos, uploadedPhoto].sort((a, b) => a.sort_order - b.sort_order);
      setVenuePhotos(next);
      setVenueForm((prev) => ({
        ...prev,
        photoUrlsText: next.map((p) => p.photo_url).join("\n"),
      }));
      setSuccess("Фото загружено");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsUploadingPhoto(false);
    }
  }
  async function submitVenueForm() {
    setSuccess(null);
    if (!venueForm.ownerId || !venueForm.title) {
      setError("Для площадки обязательны ownerId и название");
      return;
    }
    const payload = {
      ownerId: venueForm.ownerId,
      title: venueForm.title,
      description: venueForm.description,
      city: venueForm.city,
      address: venueForm.address,
      venueType: venueForm.venueType,
      capacity: Number(venueForm.capacity),
      discountPercent: Number(venueForm.discountPercent),
      inventory: parseInventory(venueForm.inventoryText),
      photos: parsePhotoUrls(venueForm.photoUrlsText),
      pricing: {
        rentalMode: venueForm.rentalMode,
        baseHourlyRate: Number(venueForm.baseHourlyRate),
        baseDailyRate: Number(venueForm.baseDailyRate),
        minimumHours: Number(venueForm.minimumHours),
        weekendMultiplier: Number(venueForm.weekendMultiplier),
        nightMultiplier: Number(venueForm.nightMultiplier),
        cleaningFee: Number(venueForm.cleaningFee),
      },
    };

    if (editingVenueId) {
      await fetch("/api/admin/venues", {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          venueId: editingVenueId,
          venuePatch: {
            title: payload.title,
            description: payload.description,
            city: payload.city,
            address: payload.address,
            venue_type: payload.venueType,
            capacity: payload.capacity,
          },
          pricingPatch: {
            base_hourly_rate: payload.pricing.baseHourlyRate,
            base_daily_rate: payload.pricing.baseDailyRate,
            minimum_hours: payload.pricing.minimumHours,
            weekend_multiplier: payload.pricing.weekendMultiplier,
            night_multiplier: payload.pricing.nightMultiplier,
            cleaning_fee: payload.pricing.cleaningFee,
          },
          discountPercent: payload.discountPercent,
          inventory: payload.inventory,
          photos: payload.photos,
        }),
      });
    } else {
      await fetch("/api/admin/venues", { method: "POST", headers, body: JSON.stringify(payload) });
    }

    setVenueForm(EMPTY_VENUE_FORM);
    setVenuePhotos([]);
    setSuccess(editingVenueId ? "Площадка обновлена" : "Площадка создана");
    setEditingVenueId(null);
    await loadAll();
  }

  async function submitUserForm() {
    setSuccess(null);
    if (!userForm.vkId || !userForm.fullName) {
      setError("Для пользователя обязательны VK ID и ФИО");
      return;
    }
    const payload = {
      vkId: Number(userForm.vkId),
      fullName: userForm.fullName,
      phone: userForm.phone,
      role: userForm.role,
      hostAccessLevel: userForm.hostAccessLevel,
    };

    if (editingUserId) {
      await fetch("/api/admin/users", {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          userId: editingUserId,
          patch: {
            full_name: payload.fullName,
            phone: payload.phone,
            role: payload.role,
            host_access_level: payload.hostAccessLevel,
          },
        }),
      });
    } else {
      await fetch("/api/admin/users", { method: "POST", headers, body: JSON.stringify(payload) });
    }

    setUserForm(EMPTY_USER_FORM);
    setSuccess(editingUserId ? "Пользователь обновлён" : "Пользователь создан");
    setEditingUserId(null);
    await loadAll();
  }

  async function startEditVenue(venue: VenueRow) {
    setEditingVenueId(venue.id);
    setVenueForm((prev) => ({ ...prev, ownerId: "", title: venue.title, city: venue.city, venueType: venue.venue_type, capacity: venue.capacity }));
    await loadVenuePhotos(venue.id);
  }

  function startEditUser(user: UserRow) {
    setEditingUserId(user.id);
    setUserForm({
      vkId: String(user.vk_id),
      fullName: user.full_name,
      phone: "",
      role: user.role,
      hostAccessLevel: user.host_access_level,
    });
  }

  async function toggleUserBlock(user: UserRow) {
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers,
      body: JSON.stringify({ userId: user.id, patch: { is_blocked: !user.is_blocked } }),
    });
    await loadAll();
  }

  async function deleteUser(userId: string) {
    await fetch(`/api/admin/users?userId=${userId}`, { method: "DELETE", headers });
    await loadAll();
  }

  async function deleteVenue(venueId: string) {
    await fetch(`/api/admin/venues?venueId=${venueId}`, { method: "DELETE", headers });
    await loadAll();
  }

  async function savePhotoOrder(nextPhotos: VenuePhoto[]) {
    if (!editingVenueId) return;

    await fetch("/api/admin/venues/photos", {
      method: "PATCH",
      headers,
      body: JSON.stringify({ venueId: editingVenueId, orderedPhotoIds: nextPhotos.map((p) => p.id) }),
    });
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

    await fetch(`/api/admin/venues/photos?venueId=${editingVenueId}&photoId=${photoId}`, {
      method: "DELETE",
      headers,
    });

    const next = venuePhotos.filter((p) => p.id !== photoId);
    setVenuePhotos(next);
    setVenueForm((prev) => ({ ...prev, photoUrlsText: next.map((p) => p.photo_url).join("\n") }));
    await savePhotoOrder(next);
  }

  return (
    <main style={{ padding: 16, display: "grid", gap: 20 }}>
      <h1>Админка агрегатора площадок</h1>
      <section>
        <label>VK ID администратора:&nbsp;<input value={vkId} onChange={(e) => setVkId(e.target.value)} /></label>
        <button onClick={loadAll} style={{ marginLeft: 8 }}>Обновить</button>
      </section>
      {error && <p style={{ color: "crimson" }}>{error}</p>}
      {success && <p style={{ color: "green" }}>{success}</p>}

      <section>
        <h2>Форма площадки ({editingVenueId ? "редактирование" : "создание"})</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <input placeholder="ownerId" value={venueForm.ownerId} onChange={(e) => setVenueForm({ ...venueForm, ownerId: e.target.value })} />
          <input placeholder="Название" value={venueForm.title} onChange={(e) => setVenueForm({ ...venueForm, title: e.target.value })} />
          <input placeholder="Описание" value={venueForm.description} onChange={(e) => setVenueForm({ ...venueForm, description: e.target.value })} />
          <input placeholder="Адрес" value={venueForm.address} onChange={(e) => setVenueForm({ ...venueForm, address: e.target.value })} />
          <input placeholder="Тип" value={venueForm.venueType} onChange={(e) => setVenueForm({ ...venueForm, venueType: e.target.value })} />
          <input type="number" placeholder="Вместимость" value={venueForm.capacity} onChange={(e) => setVenueForm({ ...venueForm, capacity: Number(e.target.value) })} />
          <input type="number" placeholder="Цена/час" value={venueForm.baseHourlyRate} onChange={(e) => setVenueForm({ ...venueForm, baseHourlyRate: Number(e.target.value) })} />
          <input type="number" placeholder="Цена/день" value={venueForm.baseDailyRate} onChange={(e) => setVenueForm({ ...venueForm, baseDailyRate: Number(e.target.value) })} />
          <input type="number" placeholder="Мин. часы" value={venueForm.minimumHours} onChange={(e) => setVenueForm({ ...venueForm, minimumHours: Number(e.target.value) })} />
          <input type="number" placeholder="Скидка %" value={venueForm.discountPercent} onChange={(e) => setVenueForm({ ...venueForm, discountPercent: Number(e.target.value) })} />
          <textarea
            style={{ gridColumn: "1 / span 2" }}
            rows={4}
            placeholder="Инвентарь: название;цена;кол-во (каждый с новой строки)"
            value={venueForm.inventoryText}
            onChange={(e) => setVenueForm({ ...venueForm, inventoryText: e.target.value })}
          />
          <textarea
            style={{ gridColumn: "1 / span 2" }}
            rows={3}
            placeholder="Фото URL (каждый с новой строки)"
            value={venueForm.photoUrlsText}
            onChange={(e) => setVenueForm({ ...venueForm, photoUrlsText: e.target.value })}
          />
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) uploadPhoto(file);
            }}
          />
          <span>{isUploadingPhoto ? "Загрузка фото..." : ""}</span>
        </div>
        {editingVenueId && (
          <div style={{ marginTop: 12 }}>
            <h3>Фотографии площадки</h3>
            {venuePhotos.length === 0 && <p>Фото пока не добавлены.</p>}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 8 }}>
              {venuePhotos.map((photo, index) => (
                <div key={photo.id} style={{ border: "1px solid #ddd", padding: 6 }}>
                  <img src={photo.photo_url} alt={`venue-photo-${index}`} style={{ width: "100%", height: 90, objectFit: "cover" }} />
                  <div style={{ display: "flex", gap: 4, marginTop: 6, flexWrap: "wrap" }}>
                    <button onClick={() => movePhoto(photo.id, "left")} disabled={index === 0}>←</button>
                    <button onClick={() => movePhoto(photo.id, "right")} disabled={index === venuePhotos.length - 1}>→</button>
                    <button onClick={() => deletePhoto(photo.id)}>Удалить</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        <button onClick={submitVenueForm} style={{ marginTop: 8 }}>{editingVenueId ? "Сохранить площадку" : "Создать площадку"}</button>
      </section>

      <section>
        <h2>Форма пользователя ({editingUserId ? "редактирование" : "создание"})</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <input placeholder="VK ID" value={userForm.vkId} onChange={(e) => setUserForm({ ...userForm, vkId: e.target.value })} />
          <input placeholder="ФИО" value={userForm.fullName} onChange={(e) => setUserForm({ ...userForm, fullName: e.target.value })} />
          <input placeholder="Телефон" value={userForm.phone} onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })} />
          <select value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}>
            <option value="guest">guest</option>
            <option value="host">host</option>
            <option value="admin">admin</option>
          </select>
          <select value={userForm.hostAccessLevel} onChange={(e) => setUserForm({ ...userForm, hostAccessLevel: e.target.value })}>
            <option value="basic">basic</option>
            <option value="pro">pro</option>
            <option value="extended">extended</option>
          </select>
        </div>
        <button onClick={submitUserForm} style={{ marginTop: 8 }}>{editingUserId ? "Сохранить пользователя" : "Создать пользователя"}</button>
      </section>

      <section>
        <h2>Drill-down аналитика</h2>
        <select value={selectedVenueId} onChange={(e) => setSelectedVenueId(e.target.value)}>
          <option value="">Без фильтра по площадке</option>
          {venues.map((v) => <option key={v.id} value={v.id}>{v.title}</option>)}
        </select>
        <select value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)} style={{ marginLeft: 8 }}>
          <option value="">Без фильтра по пользователю</option>
          {users.map((u) => <option key={u.id} value={u.id}>{u.full_name}</option>)}
        </select>
        <pre>{JSON.stringify(analytics, null, 2)}</pre>
      </section>

      <section>
        <h2>Площадки ({venues.length})</h2>
        <table border={1} cellPadding={8}><tbody>{venues.map((venue) => <tr key={venue.id}><td>{venue.title}</td><td>{venue.city}</td><td>{venue.venue_type}</td><td>{venue.capacity}</td><td><button onClick={() => startEditVenue(venue)}>Редактировать</button><button onClick={() => deleteVenue(venue.id)}>Удалить</button></td></tr>)}</tbody></table>
      </section>

      <section>
        <h2>Пользователи ({users.length})</h2>
        <table border={1} cellPadding={8}><tbody>{users.map((user) => <tr key={user.id}><td>{user.full_name}</td><td>{user.vk_id}</td><td>{user.role}</td><td>{user.host_access_level}</td><td>{user.is_blocked ? "Да" : "Нет"}</td><td><button onClick={() => startEditUser(user)}>Редактировать</button><button onClick={() => toggleUserBlock(user)}>{user.is_blocked ? "Разблокировать" : "Заблокировать"}</button><button onClick={() => deleteUser(user.id)}>Удалить</button></td></tr>)}</tbody></table>
      </section>
    </main>
  );
}
