# Blueprint: Airbnb-like VK Mini App

## 1) Роли и права доступа

### Guest (Пользователь)
- Регистрация/вход через VK.
- Поиск объектов по городу, датам, цене, удобствам.
- Просмотр карточек и деталей объекта.
- Бронирование, оплата, отмена.
- Чат с хостом.
- Отзывы и рейтинг.
- Избранное, история поездок.

### Host (Хост / Арендодатель)
- Создание/редактирование объявлений.
- Управление календарём доступности.
- Динамическое ценообразование (будни/выходные/сезон).
- Подтверждение или отклонение бронирований.
- Коммуникация с гостями.
- Финансовая статистика (доход, загрузка, средний чек).

### Admin (Администратор)
- Модерация объявлений и отзывов.
- Управление пользователями и ролями.
- Разбор жалоб/споров.
- Контроль выплат и комиссий.
- Audit log: кто/когда/что изменил.

---

## 2) Ключевые пользовательские функции (MVP → Scale)

### MVP
1. Каталог + поиск + базовые фильтры.
2. Карточка объекта + фото + удобства + правила.
3. Бронирование по датам с проверкой доступности.
4. Вход через VK и личные кабинеты по ролям.
5. Админ-модерация новых объявлений.

### Post-MVP
1. Безопасная сделка / escrow.
2. Умные рекомендации.
3. Динамические цены с ML.
4. Реферальная и бонусная система.

---

## 3) Архитектура

- **Client:** VK Mini App UI (можно на Next.js + адаптация под mini apps).
- **Auth:** VK ID + проверка подписи initData на backend.
- **API:** BFF/REST (или GraphQL), строгий RBAC.
- **DB:** PostgreSQL.
- **Storage:** S3-совместимое хранилище для фото.
- **Payments:** ЮKassa/CloudPayments/другой PSP.
- **Notifications:** VK уведомления + email/SMS fallback.

---

## 4) Модель данных (минимум)

- `users(id, vk_user_id, role, name, phone, created_at)`
- `properties(id, host_id, title, city, lat, lng, price_night, status, created_at)`
- `property_images(id, property_id, url, sort_order)`
- `bookings(id, property_id, guest_id, date_from, date_to, guests, total_price, status)`
- `reviews(id, booking_id, author_id, rating, text, status)`
- `payments(id, booking_id, amount, currency, status, provider_ref)`
- `audit_logs(id, actor_id, action, entity_type, entity_id, payload, created_at)`

`status`-поля:
- property: `draft|pending|active|blocked`
- booking: `pending|confirmed|cancelled|completed`
- review: `pending|published|rejected`

---

## 5) API (пример)

### Public/User
- `GET /properties`
- `GET /properties/:id`
- `POST /bookings`
- `GET /me/bookings`
- `POST /reviews`

### Host
- `POST /host/properties`
- `PATCH /host/properties/:id`
- `GET /host/bookings`
- `PATCH /host/bookings/:id/status`

### Admin
- `GET /admin/moderation/properties`
- `PATCH /admin/moderation/properties/:id`
- `GET /admin/users`
- `PATCH /admin/users/:id/role`

---

## 6) Безопасность

1. Проверка подписи данных от VK на backend.
2. JWT session + refresh rotation.
3. Row-level access: host видит только свои объекты.
4. Rate limit + antifraud (бронирования/платежи).
5. Логирование критических действий админов.

---

## 7) Пошаговый план реализации

1. Внедрить VK auth flow и маппинг `vk_user_id -> user`.
2. Реализовать RBAC middleware (guest/host/admin).
3. Собрать каталог, карточку объекта, бронирование.
4. Добавить кабинет хоста (объявления + заявки).
5. Добавить админ-панель (модерация + роли).
6. Подключить платежи и webhooks.
7. Закрыть тестами критические сценарии.

---

## 8) Что важно для релиза

- Юридические документы: оферта, политика, правила отмен.
- SLA поддержки и процесс споров.
- Мониторинг: ошибки, конверсия, fraud-сигналы.
- Обязательный backup и disaster recovery план.
