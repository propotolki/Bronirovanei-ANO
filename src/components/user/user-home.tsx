"use client";

import { useState } from "react";

type Mode = "guest" | "host";

type Venue = {
  id: string;
  title: string;
  city: string;
  address: string;
  venue_type: string;
  capacity: number;
  pricing_rules?: { base_hourly_rate: number; base_daily_rate: number; rental_mode: string }[];
};

export function UserHome() {
  const [mode, setMode] = useState<Mode | null>(null);
  const [vkId, setVkId] = useState("1703478");
  const [fullName, setFullName] = useState("Иван Иванов");
  const [userId, setUserId] = useState<string>("");
  const [venues, setVenues] = useState<Venue[]>([]);
  const [status, setStatus] = useState<string>("");

  const [bookingVenueId, setBookingVenueId] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");

  const [hostTitle, setHostTitle] = useState("");
  const [hostAddress, setHostAddress] = useState("");
  const [hostPhotoUrls, setHostPhotoUrls] = useState("");
  const [hostInventory, setHostInventory] = useState("");
  const [hostWorkingHours, setHostWorkingHours] = useState("08:00-23:00");
  const [hourlyRate, setHourlyRate] = useState(1500);
  const [hostPlan, setHostPlan] = useState<any>(null);

  async function openMode(nextMode: Mode) {
    setMode(nextMode);
    setStatus("");

    const sessionRes = await fetch("/api/user/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vkId: Number(vkId), fullName, intent: nextMode === "host" ? "host" : "guest" }),
    });

    const sessionJson = await sessionRes.json();
    if (!sessionRes.ok) {
      setStatus(sessionJson.error ?? "Ошибка создания сессии");
      return;
    }

    setUserId(sessionJson.user.id);

    if (nextMode === "guest") {
      const venuesRes = await fetch("/api/venues");
      const venuesJson = await venuesRes.json();
      setVenues(venuesJson.venues ?? []);
    }

    if (nextMode === "host") {
      const planRes = await fetch("/api/host/plan", { headers: { "x-vk-id": vkId } });
      const planJson = await planRes.json();
      if (planRes.ok) setHostPlan(planJson);
    }
  }

  async function createBooking() {
    const rentalMode = "hourly";
    const res = await fetch("/api/bookings/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        venueId: bookingVenueId,
        guestId: userId,
        startAt,
        endAt,
        rentalMode,
      }),
    });

    const json = await res.json();
    setStatus(res.ok ? `Бронирование создано: ${json.booking.id}` : (json.error ?? "Ошибка бронирования"));
  }

  async function startTrial() {
    const res = await fetch("/api/host/trial", { method: "POST", headers: { "x-vk-id": vkId } });
    const json = await res.json();
    setStatus(res.ok ? "Триал активирован на 3 дня" : (json.error ?? "Не удалось активировать триал"));
    const planRes = await fetch("/api/host/plan", { headers: { "x-vk-id": vkId } });
    const planJson = await planRes.json();
    if (planRes.ok) setHostPlan(planJson);
  }

  async function createHostVenue() {
    const photos = hostPhotoUrls.split("\n").map((x) => x.trim()).filter(Boolean);
    const inventory = hostInventory
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [name, price = "0", quantity = "1"] = line.split(";").map((x) => x.trim());
        return { name, unitPrice: Number(price), quantity: Number(quantity), included: false };
      });

    const res = await fetch("/api/host/venues", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-vk-id": vkId },
      body: JSON.stringify({
        title: hostTitle,
        address: hostAddress,
        photos,
        inventory,
        workingHours: hostWorkingHours,
        pricing: {
          rentalMode: "hourly",
          baseHourlyRate: hourlyRate,
          baseDailyRate: hourlyRate * 8,
          minimumHours: 2,
          weekendMultiplier: 1,
          nightMultiplier: 1,
          cleaningFee: 0,
        },
      }),
    });

    const json = await res.json();
    setStatus(res.ok ? `Площадка размещена: ${json.venueId}` : (json.error ?? "Ошибка размещения"));

    const planRes = await fetch("/api/host/plan", { headers: { "x-vk-id": vkId } });
    const planJson = await planRes.json();
    if (planRes.ok) setHostPlan(planJson);
  }

  return (
    <main style={{ padding: 16, display: "grid", gap: 16 }}>
      <h1>Агрегатор площадок</h1>
      <div style={{ display: "flex", gap: 8 }}>
        <input value={vkId} onChange={(e) => setVkId(e.target.value)} placeholder="VK ID" />
        <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="ФИО" />
      </div>

      {!mode && (
        <section style={{ display: "flex", gap: 12 }}>
          <button onClick={() => openMode("guest")}>Снять помещение</button>
          <button onClick={() => openMode("host")}>Сдать помещение</button>
        </section>
      )}

      {mode === "guest" && (
        <section>
          <h2>Список помещений</h2>
          {venues.map((v) => (
            <div key={v.id} style={{ border: "1px solid #ddd", marginBottom: 8, padding: 8 }}>
              <strong>{v.title}</strong> · {v.city}, {v.address} · {v.venue_type} · до {v.capacity} чел.
              <div>Цена/час: {v.pricing_rules?.[0]?.base_hourly_rate ?? "—"} ₽</div>
              <button onClick={() => setBookingVenueId(v.id)}>Выбрать для брони</button>
            </div>
          ))}

          <h3>Забронировать</h3>
          <input value={bookingVenueId} onChange={(e) => setBookingVenueId(e.target.value)} placeholder="venueId" />
          <input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} />
          <input type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} />
          <button onClick={createBooking}>Создать бронь</button>
        </section>
      )}

      {mode === "host" && (
        <section style={{ display: "grid", gap: 8, maxWidth: 700 }}>
          <h2>Разместить площадку</h2>
          <div style={{ border: "1px solid #ddd", padding: 8 }}>
            <strong>Тариф:</strong> {hostPlan?.effectivePlan ?? "—"}<br />
            <strong>Лимит площадок:</strong> {hostPlan?.features?.venueLimit ?? "—"}<br />
            <strong>Аналитика:</strong> {hostPlan?.features?.analyticsLevel ?? "—"}<br />
            <strong>Продвижения:</strong> {hostPlan?.promotionsUsed ?? 0} / {hostPlan?.features?.promotionLimit ?? 0}
            <div><button onClick={startTrial}>Активировать free trial 3 дня</button></div>
          </div>
          <input value={hostTitle} onChange={(e) => setHostTitle(e.target.value)} placeholder="Название площадки" />
          <input value={hostAddress} onChange={(e) => setHostAddress(e.target.value)} placeholder="Адрес" />
          <input value={hostWorkingHours} onChange={(e) => setHostWorkingHours(e.target.value)} placeholder="Время работы, например 08:00-23:00" />
          <input type="number" value={hourlyRate} onChange={(e) => setHourlyRate(Number(e.target.value))} placeholder="Цена за час" />
          <textarea rows={3} value={hostPhotoUrls} onChange={(e) => setHostPhotoUrls(e.target.value)} placeholder="Фото URL (по одному на строку)" />
          <textarea rows={3} value={hostInventory} onChange={(e) => setHostInventory(e.target.value)} placeholder="Инвентарь: название;цена;кол-во" />
          <button onClick={createHostVenue}>Опубликовать площадку</button>
        </section>
      )}

      {status && <p>{status}</p>}
    </main>
  );
}
