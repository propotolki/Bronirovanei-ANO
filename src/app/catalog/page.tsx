"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { ListingCard } from "@/components/listing-card";
import type { Listing } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Nizhny Novgorod districts (example)
const DISTRICTS = [
  { value: "all", label: "Все районы" },
  { value: "нжегородский", label: "Нижегородский" },
  { value: "советский", label: "Советский" },
  { value: "приокский", label: "Приокский" },
  { value: "сормовский", label: "Сормовский" },
  { value: "московский", label: "Московский" },
  { value: "автозаводский", label: "Автозаводский" },
];

const VENUE_TYPES = [
  { value: "all", label: "Все типы" },
  { value: "loft", label: "Лофт" },
  { value: "hall", label: "Зал" },
  { value: "meeting_room", label: "Переговорная" },
  { value: "coworking", label: "Коворкинг" },
  { value: "studio", label: "Студия" },
];

interface VenueAPI {
  id: string;
  title: string;
  description: string;
  city: string;
  price_per_night: number;
  status: string;
  venue_type: string;
  capacity: number;
  venue_photos?: Array<{ photo_url: string }>;
  pricing_rules?: Array<{ base_hourly_rate: number; base_daily_rate: number; rental_mode: string }>;
}

function mapVenueToListing(venue: VenueAPI): Listing {
  return {
    id: venue.id,
    hostId: "",
    title: venue.title,
    description: venue.description || "",
    city: venue.city,
    pricePerNight: venue.price_per_night || 0,
    status: venue.status as any,
    image: venue.venue_photos?.[0]?.photo_url || "https://placehold.co/600x400.png",
    venueType: venue.venue_type,
    capacity: venue.capacity,
  };
}

export default function CatalogPage() {
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [district, setDistrict] = useState("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minCapacity, setMinCapacity] = useState("");
  const [venueType, setVenueType] = useState("all");
  const [hasInventory, setHasInventory] = useState(false);

  const fetchVenues = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (district && district !== "all") params.set("district", district);
      if (minPrice) params.set("minPrice", minPrice);
      if (maxPrice) params.set("maxPrice", maxPrice);
      if (minCapacity) params.set("minCapacity", minCapacity);
      if (venueType && venueType !== "all") params.set("venueType", venueType);
      if (hasInventory) params.set("hasInventory", "true");

      const res = await fetch(`/api/venues?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load venues");
      const json = await res.json();
      const venues: VenueAPI[] = json.venues || [];
      setListings(venues.map(mapVenueToListing));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVenues();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [district, minPrice, maxPrice, minCapacity, venueType, hasInventory]);

  const handleReset = () => {
    setDistrict("all");
    setMinPrice("");
    setMaxPrice("");
    setMinCapacity("");
    setVenueType("all");
    setHasInventory(false);
  };

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
      <div className="flex-grow container mx-auto p-4 sm:p-6 md:p-8">
        <h1 className="text-4xl font-headline font-bold mb-8 text-center">Каталог жилья</h1>

        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl">Фильтры</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* District */}
              <div className="space-y-2">
                <Label htmlFor="district">Район</Label>
                <Select value={district} onValueChange={setDistrict}>
                  <SelectTrigger id="district">
                    <SelectValue placeholder="Выберите район" />
                  </SelectTrigger>
                  <SelectContent>
                    {DISTRICTS.map((d) => (
                      <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Venue Type */}
              <div className="space-y-2">
                <Label htmlFor="venueType">Тип площадки</Label>
                <Select value={venueType} onValueChange={setVenueType}>
                  <SelectTrigger id="venueType">
                    <SelectValue placeholder="Выберите тип" />
                  </SelectTrigger>
                  <SelectContent>
                    {VENUE_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Price Range */}
              <div className="space-y-2">
                <Label>Цена (₽)</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="От"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                  />
                  <Input
                    type="number"
                    placeholder="До"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                  />
                </div>
              </div>

              {/* Capacity */}
              <div className="space-y-2">
                <Label htmlFor="capacity">Вместимость (от)</Label>
                <Input
                  id="capacity"
                  type="number"
                  placeholder="Например, 10"
                  value={minCapacity}
                  onChange={(e) => setMinCapacity(e.target.value)}
                />
              </div>
            </div>

            {/* Inventory checkbox */}
            <div className="flex items-center space-x-2 mt-4">
              <input
                type="checkbox"
                id="inventory"
                checked={hasInventory}
                onChange={(e) => setHasInventory(e.target.checked)}
                className="h-4 w-4 rounded border border-primary"
              />
              <Label htmlFor="inventory">С инвентарём</Label>
            </div>

            {/* Reset button */}
            <Button variant="outline" onClick={handleReset} className="mt-4">
              Сбросить фильтры
            </Button>
          </CardContent>
        </Card>

        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        {listings.length === 0 ? (
          <p className="text-center text-muted-foreground">Пока нет доступных площадок</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}