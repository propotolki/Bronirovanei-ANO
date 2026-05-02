"use client"

import { AppHeader } from "@/components/app-header";
import { ListingCard } from "@/components/listing-card";
import { mockListings } from "@/lib/data";

export default function CatalogPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <div className="flex-grow container mx-auto p-4 sm:p-6 md:p-8">
        <h1 className="text-4xl font-headline font-bold mb-8 text-center">Каталог жилья</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {mockListings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </div>
    </div>
  );
}
