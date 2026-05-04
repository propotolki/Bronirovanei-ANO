"use client"

import { useEffect, useState } from 'react';
import { AppHeader } from "@/components/app-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Home } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Listing } from '@/lib/types';

interface VenueAPI {
  id: string;
  title: string;
  city: string;
  price_per_night: number;
  status: string;
}

function mapVenueToListing(venue: VenueAPI): Listing {
  return {
    id: venue.id,
    hostId: "",
    title: venue.title,
    description: "",
    city: venue.city,
    pricePerNight: venue.price_per_night || 0,
    status: venue.status as any,
    image: "https://placehold.co/600x400.png",
  };
}

export default function OwnerPage() {
  const { toast } = useToast();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [city, setCity] = useState('');
  const [price, setPrice] = useState('');

  useEffect(() => {
    async function loadVenues() {
      try {
        const res = await fetch("/api/host/venues");
        if (!res.ok) throw new Error("Failed to load venues");
        const json = await res.json();
        const venues: VenueAPI[] = json.venues || [];
        setListings(venues.map(mapVenueToListing));
      } catch (e: any) {
        toast({ variant: 'destructive', title: 'Ошибка', description: e.message });
      } finally {
        setLoading(false);
      }
    }
    loadVenues();
  }, [toast]);

  const handleAddListing = async () => {
    if (!title || !city || !price) {
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Заполните все поля.' });
      return;
    }
    
    try {
      const res = await fetch("/api/admin/venues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerId: "", // Will be set by server from session
          title,
          description: '',
          city,
          venueType: 'loft',
          capacity: 1,
          pricing: {
            rentalMode: 'daily',
            baseHourlyRate: 0,
            baseDailyRate: Number(price),
            minimumHours: 1,
            weekendMultiplier: 1,
            nightMultiplier: 1,
            cleaningFee: 0,
          }
        })
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create venue");
      }
      
      toast({ title: 'Успех', description: 'Объявление отправлено на модерацию.' });
      setTitle('');
      setCity('');
      setPrice('');
      
      // Reload listings
      const reloadRes = await fetch("/api/host/venues");
      if (reloadRes.ok) {
        const json = await reloadRes.json();
        const venues: VenueAPI[] = json.venues || [];
        setListings(venues.map(mapVenueToListing));
      }
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Ошибка', description: e.message });
    }
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
        <h1 className="text-4xl font-headline font-bold mb-2">Кабинет хоста</h1>
        <p className="text-muted-foreground mb-8">Управление объектами аренды.</p>

        <div className="grid md:grid-cols-2 gap-8">
            <Card>
                <CardHeader>
                    <CardTitle>Новое объявление</CardTitle>
                    <CardDescription>Добавьте объект для аренды.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Название</Label>
                        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Например, Студия в центре"/>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="city">Город</Label>
                        <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Москва"/>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="price">Цена за ночь, ₽</Label>
                        <Input id="price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="3000"/>
                    </div>
                    <Button onClick={handleAddListing} className="w-full">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Добавить объект
                    </Button>
                </CardContent>
            </Card>

            <Card>
                 <CardHeader>
                    <CardTitle>Мои объявления</CardTitle>
                    <CardDescription>Список ваших объектов.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Название</TableHead>
                                <TableHead>Город</TableHead>
                                <TableHead>Цена</TableHead>
                                <TableHead>Статус</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {listings.map(listing => (
                                <TableRow key={listing.id}>
                                    <TableCell>{listing.title}</TableCell>
                                    <TableCell>{listing.city}</TableCell>
                                    <TableCell>{listing.pricePerNight.toLocaleString('ru-RU')} ₽</TableCell>
                                    <TableCell>{listing.status}</TableCell>
                                </TableRow>
                            ))}
                            {listings.length === 0 && (
                              <TableRow>
                                <TableCell colSpan={4} className="text-center text-muted-foreground">
                                  Пока нет объявлений
                                </TableCell>
                              </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}