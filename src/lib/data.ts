import type { Listing, User } from '@/lib/types';

export const mockListings: Listing[] = [
  {
    id: '1',
    hostId: 'host-1',
    title: 'Уютная студия в центре Москвы',
    description: 'Современная студия с панорамным видом на город. Рядом метро и парки.',
    city: 'Москва',
    pricePerNight: 3500,
    status: 'active',
    image: 'https://placehold.co/600x400.png',
    lat: 55.751244,
    lng: 37.618423,
  },
  {
    id: '2',
    hostId: 'host-2',
    title: 'Апартаменты у Невского проспекта',
    description: 'Просторные апартаменты в историческом центре Санкт-Петербурга.',
    city: 'Санкт-Петербург',
    pricePerNight: 4200,
    status: 'active',
    image: 'https://placehold.co/600x400.png',
    lat: 59.934280,
    lng: 30.335099,
  },
  {
    id: '3',
    hostId: 'host-1',
    title: 'Квартира с видом на море в Сочи',
    description: 'Две спальни, большая терраса и выход к пляжу.',
    city: 'Сочи',
    pricePerNight: 5500,
    status: 'active',
    image: 'https://placehold.co/600x400.png',
    lat: 43.602808,
    lng: 39.734154,
  },
];

export const mockUsers: User[] = [
  {
    id: '1',
    name: 'Алексей К.',
    phone: '79991234567',
    role: 'guest',
  },
  {
    id: '2',
    name: 'Иван С.',
    phone: '79997654321',
    role: 'host',
  },
  {
    id: '3',
    name: 'Мария Б.',
    phone: '79111112233',
    role: 'admin',
  },
];
