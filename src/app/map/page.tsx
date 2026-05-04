"use client";

import { useEffect, useState } from "react";
import { AppHeader } from '@/components/app-header';
import { YandexMap } from '@/components/map/yandex-map';

interface MapPoint {
  id: string;
  title: string;
  lat: number;
  lng: number;
}

export default function MapPage() {
  const [points, setPoints] = useState<MapPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadVenues() {
      try {
        const res = await fetch("/api/venues");
        if (!res.ok) throw new Error("Failed to load venues");
        const json = await res.json();
        const venues = json.venues || [];
        const mapPoints = venues
          .filter((v: any) => v.lat && v.lng)
          .map((v: any) => ({
            id: v.id,
            title: v.title,
            lat: v.lat,
            lng: v.lng,
          }));
        setPoints(mapPoints);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    loadVenues();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <AppHeader />
        <div className="flex-grow flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <div className="container mx-auto p-4 sm:p-6 md:p-8 space-y-4">
        <h1 className="text-3xl font-bold">Карта объектов</h1>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        {points.length === 0 ? (
          <p className="text-center text-muted-foreground">Пока нет объектов на карте</p>
        ) : (
          <YandexMap points={points} />
        )}
      </div>
    </div>
  );
}
