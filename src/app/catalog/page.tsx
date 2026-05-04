"use client"

import { useEffect, useState } from "react";
import { AppHeader } from "@/components/app-header";
import { ListingCard } from "@/components/listing-card";
import type { Listing } from "@/lib/types";

interface VenueAPI {
  id: string;
  title: string;
  description: string;
  city: string;
  price_per_night: number;
  status: string;
  venue_photos?: Array<{ photo_url: string }>;
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
  };
}

export default function CatalogPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadVenues() {
      try {
        const res = await fetch("/api/venues");
        if (!res.ok) throw new Error("Failed to load venues");
        const json = await res.json();
        const venues: VenueAPI[] = json.venues || [];
        setListings(venues.map(mapVenueToListing));
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
      <div className="flex-grow container mx-auto p-4 sm:p-6 md:p-8">
        <h1 className="text-4xl font-headline font-bold mb-8 text-center">Каталог жилья</h1>
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
