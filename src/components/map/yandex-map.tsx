"use client";

type MapPoint = {
  id: string;
  title: string;
  lat: number;
  lng: number;
};

export function YandexMap({ points }: { points: MapPoint[] }) {
  const center = points[0] ?? { lat: 55.751244, lng: 37.618423 };
  const markerQuery = points.map((p) => `${p.lng},${p.lat},pm2rdm`).join('~');
  const src = `https://static-maps.yandex.ru/1.x/?lang=ru_RU&ll=${center.lng},${center.lat}&z=11&size=650,400&l=map&pt=${markerQuery}`;

  return (
    <div className="rounded-xl overflow-hidden border">
      <img src={src} alt="Карта объектов" className="w-full h-auto" />
    </div>
  );
}
