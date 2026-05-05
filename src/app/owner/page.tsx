"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Home, CalendarIcon, DollarSign, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Listing } from "@/lib/types";

interface VenueAPI {
  id: string;
  title: string;
  city: string;
  price_per_night: number;
  status: string;
  venue_type: string;
  capacity: number;
}

interface BookingAPI {
  id: string;
  venue_id: string;
  listing_id: string;
  guest_id: string;
  status: string;
  total_amount: number;
  start_at: string;
  end_at: string;
  listings?: { title: string };
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
    venueType: venue.venue_type,
    capacity: venue.capacity,
  };
}

export default function OwnerPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("venues");
  
  // Venues state
  const [listings, setListings] = useState<Listing[]>([]);
  const [venuesLoading, setVenuesLoading] = useState(true);
  
  // Bookings state
  const [bookings, setBookings] = useState<BookingAPI[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  
  // Stats state
  const [stats, setStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  
  // Form state
  const [title, setTitle] = useState('');
  const [city, setCity] = useState('');
  const [price, setPrice] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  
  // Inventory state
  interface InventoryItem {
    id: number;
    name: string;
    price: string;
    quantity: string;
  }
  const [inventory, setInventory] = useState<InventoryItem[]>([
    { id: 1, name: '', price: '', quantity: '1' }
  ]);
  const [nextInventoryId, setNextInventoryId] = useState(2);

  const addInventoryItem = () => {
    setInventory([...inventory, { id: nextInventoryId, name: '', price: '', quantity: '1' }]);
    setNextInventoryId(nextInventoryId + 1);
  };

  const removeInventoryItem = (id: number) => {
    if (inventory.length > 1) {
      setInventory(inventory.filter(item => item.id !== id));
    }
  };

  const updateInventoryItem = (id: number, field: keyof InventoryItem, value: string) => {
    setInventory(inventory.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  // Fetch venues
  useEffect(() => {
    async function loadVenues() {
      try {
        // Get VK ID from URL or localStorage
        const urlParams = new URLSearchParams(window.location.search);
        const urlVkId = urlParams.get('vk_id');
        const storedVkId = typeof window !== 'undefined' ? localStorage.getItem("vk_id") : null;
        const vkId = urlVkId || storedVkId || "";
        
        const res = await fetch("/api/host/venues", {
          headers: { "x-vk-id": vkId }
        });
        
        if (!res.ok) {
          const errorJson = await res.json().catch(() => ({}));
          throw new Error(errorJson.error || `HTTP ${res.status}: Failed to load venues`);
        }
        const json = await res.json();
        const venues: VenueAPI[] = json.venues || [];
        setListings(venues.map(mapVenueToListing));
      } catch (e: any) {
        console.error("Failed to load venues:", e);
        toast({ variant: 'destructive', title: 'Ошибка', description: e.message });
      } finally {
        setVenuesLoading(false);
      }
    }
    loadVenues();
  }, [toast]);

  // Fetch bookings
  useEffect(() => {
    async function loadBookings() {
      try {
        const res = await fetch("/api/host/bookings");
        if (!res.ok) throw new Error("Failed to load bookings");
        const json = await res.json();
        setBookings(json.data || []);
      } catch (e: any) {
        console.error("Failed to load bookings:", e);
      } finally {
        setBookingsLoading(false);
      }
    }
    if (activeTab === "bookings") {
      loadBookings();
    }
  }, [activeTab, toast]);

  // Fetch stats
  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch("/api/host/stats");
        if (!res.ok) throw new Error("Failed to load stats");
        const json = await res.json();
        setStats(json);
      } catch (e: any) {
        console.error("Failed to load stats:", e);
      } finally {
        setStatsLoading(false);
      }
    }
    if (activeTab === "stats") {
      loadStats();
    }
  }, [activeTab, toast]);

  const handleAddListing = async () => {
    if (!title || !city || !price) {
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Заполните все поля.' });
      return;
    }
    
    // Prepare inventory items (filter out empty names)
    const inventoryItems = inventory
      .filter(item => item.name.trim() !== '')
      .map(item => ({
        name: item.name,
        included: false,
        unitPrice: Number(item.price) || 0,
        quantity: Number(item.quantity) || 1,
      }));

    try {
      const res = await fetch("/api/admin/venues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerId: "",
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
          },
          inventory: inventoryItems,
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
      setInventory([{ id: 1, name: '', price: '', quantity: '1' }]);
      
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <div className="flex-grow container mx-auto p-4 sm:p-6 md:p-8">
        <h1 className="text-4xl font-headline font-bold mb-2">Кабинет хоста</h1>
        <p className="text-muted-foreground mb-8">Управление объектами аренды.</p>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="venues">
              <Home className="mr-2 h-4 w-4" />
              Площадки
            </TabsTrigger>
            <TabsTrigger value="calendar">
              <CalendarIcon className="mr-2 h-4 w-4" />
              Календарь
            </TabsTrigger>
            <TabsTrigger value="bookings">
              <PlusCircle className="mr-2 h-4 w-4" />
              Бронирования
            </TabsTrigger>
            <TabsTrigger value="stats">
              <BarChart3 className="mr-2 h-4 w-4" />
              Статистика
            </TabsTrigger>
          </TabsList>

          {/* Venues Tab */}
          <TabsContent value="venues" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Новое объявление</CardTitle>
                  <CardDescription>Добавьте объект для аренды.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="title">Название</label>
                    <input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Например, Студия в центре"
                      className="w-full p-2 border rounded-md"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="city">Город</label>
                    <input
                      id="city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Нижний Новгород"
                      className="w-full p-2 border rounded-md"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="price">Цена за час, ₽</label>
                    <input
                      id="price"
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="500"
                      className="w-full p-2 border rounded-md"
                    />
                  </div>

                  {/* Inventory section */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label>Инвентарь</label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addInventoryItem}
                      >
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Добавить позицию
                      </Button>
                    </div>
                    {inventory.map((item) => (
                      <div key={item.id} className="grid grid-cols-3 gap-2 items-end">
                        <div>
                          <label htmlFor={`inv-name-${item.id}`} className="text-sm">Название</label>
                          <input
                            id={`inv-name-${item.id}`}
                            value={item.name}
                            onChange={(e) => updateInventoryItem(item.id, 'name', e.target.value)}
                            placeholder="Например, Стол"
                            className="w-full p-2 border rounded-md text-sm"
                          />
                        </div>
                        <div>
                          <label htmlFor={`inv-price-${item.id}`} className="text-sm">Цена, ₽</label>
                          <input
                            id={`inv-price-${item.id}`}
                            type="number"
                            value={item.price}
                            onChange={(e) => updateInventoryItem(item.id, 'price', e.target.value)}
                            placeholder="0"
                            className="w-full p-2 border rounded-md text-sm"
                          />
                        </div>
                        <div>
                          <label htmlFor={`inv-qty-${item.id}`} className="text-sm">Кол-во</label>
                          <div className="flex gap-1">
                            <input
                              id={`inv-qty-${item.id}`}
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateInventoryItem(item.id, 'quantity', e.target.value)}
                              placeholder="1"
                              className="w-full p-2 border rounded-md text-sm"
                            />
                            {inventory.length > 1 && (
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => removeInventoryItem(item.id)}
                              >
                                ✕
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
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
                  {venuesLoading ? (
                    <div className="flex justify-center p-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : (
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
                          <TableRow 
                            key={listing.id}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => router.push(`/catalog/${listing.id}`)}
                          >
                            <TableCell>{listing.title}</TableCell>
                            <TableCell>{listing.city}</TableCell>
                            <TableCell>{listing.pricePerNight.toLocaleString('ru-RU')} ₽/час</TableCell>
                            <TableCell>
                              <Badge variant={listing.status === 'active' ? 'default' : 'secondary'}>
                                {listing.status}
                              </Badge>
                            </TableCell>
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
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Calendar Tab */}
          <TabsContent value="calendar" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Календарь доступности</CardTitle>
                <CardDescription>Выберите дату для управления доступностью.</CardDescription>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border"
                />
                {selectedDate && (
                  <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                    <p className="font-semibold">Выбрана дата: {selectedDate.toLocaleDateString('ru-RU')}</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Здесь будет список бронирований на выбранную дату и возможность управления доступностью.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bookings Tab */}
          <TabsContent value="bookings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Бронирования</CardTitle>
                <CardDescription>Список бронирований ваших площадок.</CardDescription>
              </CardHeader>
              <CardContent>
                {bookingsLoading ? (
                  <div className="flex justify-center p-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Площадка</TableHead>
                        <TableHead>Даты</TableHead>
                        <TableHead>Сумма</TableHead>
                        <TableHead>Статус</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bookings.map((booking) => (
                        <TableRow key={booking.id}>
                          <TableCell>{booking.listings?.title || '—'}</TableCell>
                          <TableCell>
                            {formatDate(booking.start_at)} - {formatDate(booking.end_at)}
                          </TableCell>
                          <TableCell>{Number(booking.total_amount).toLocaleString('ru-RU')} ₽</TableCell>
                          <TableCell>
                            <Badge variant={
                              booking.status === 'confirmed' ? 'default' :
                              booking.status === 'pending' ? 'secondary' : 'destructive'
                            }>
                              {booking.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                      {bookings.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground">
                            Пока нет бронирований
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Stats Tab */}
          <TabsContent value="stats" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Всего площадок</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{listings.length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Активные брони</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">
                    {bookings.filter(b => b.status === 'confirmed').length}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Доход</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">
                    {bookings
                      .filter(b => b.status === 'confirmed')
                      .reduce((sum, b) => sum + Number(b.total_amount), 0)
                      .toLocaleString('ru-RU')} ₽
                  </p>
                </CardContent>
              </Card>
            </div>
            {statsLoading ? (
              <div className="flex justify-center p-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : stats ? (
              <Card>
                <CardHeader>
                  <CardTitle>Детальная статистика</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-sm">{JSON.stringify(stats, null, 2)}</pre>
                </CardContent>
              </Card>
            ) : null}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}