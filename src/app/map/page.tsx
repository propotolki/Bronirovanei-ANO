import { AppHeader } from '@/components/app-header';
import { YandexMap } from '@/components/map/yandex-map';
import { mockListings } from '@/lib/data';

const mapPoints = mockListings
  .filter((l) => l.lat && l.lng)
  .map((l) => ({
    id: l.id,
    title: l.title,
    lat: l.lat!,
    lng: l.lng!,
  }));

export default function MapPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <div className="container mx-auto p-4 sm:p-6 md:p-8 space-y-4">
        <h1 className="text-3xl font-bold">Карта объектов</h1>
        <YandexMap points={mapPoints} />
      </div>
    </div>
  );
}
