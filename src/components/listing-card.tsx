"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";
import type { Listing } from "@/lib/types";

interface ListingCardProps {
  listing: Listing;
}

export function ListingCard({ listing }: ListingCardProps) {
  return (
    <Card className="flex flex-col overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1 duration-300">
      <CardHeader className="p-0">
        <div className="relative aspect-[4/3]">
          <Image
            src={listing.image}
            alt={listing.title}
            fill
            className="object-cover"
          />
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-grow flex flex-col">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg font-headline mb-1">{listing.title}</CardTitle>
          <Badge variant={listing.status === 'active' ? 'default' : 'secondary'}>
            {listing.status}
          </Badge>
        </div>
        <CardDescription className="flex-grow line-clamp-2">{listing.description}</CardDescription>
        <div className="mt-3 flex items-center text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 mr-1" />
          {listing.city}
        </div>
      </CardContent>
      <CardFooter className="p-4 flex justify-between items-center bg-muted/50">
        <p className="text-xl font-bold font-headline text-primary">{listing.pricePerNight.toLocaleString('ru-RU')} ₽<span className="text-sm font-normal text-muted-foreground"> / ночь</span></p>
        <Button size="sm">Подробнее</Button>
      </CardFooter>
    </Card>
  );
}
