# DataLouna

Фреймворк [Express]

Копируем переменные окружения(данные рабочие оставил, т.к. аккаунт был зарегистрирован на временную почту для теста)

```sh
	cp .env.example .env
```

```sh
	npm install
```

Для запуска postgres и redis

```sh
	docker-compose up
```

Для запуска приложения, создания таблиц и заполнения таблицы [products]

```sh
	npm run dev
```

Схема базы данных в корне проекта [schema.jpg]

Для регистрации пользователя [POST] [http://localhost:3500/auth/register]

пример body:

```sh
		"name": "user3",
		"email": "user3@mail.ru",
		"password": "password",
		"balance": 100
```

Для авторизации пользователя [POST] [http://localhost:3500/auth/login]

пример body:

```sh
		"name": "user3",
		"email": "user3@mail.ru",
		"password": "password",
		"balance": 100
```

Для смены пароля [POST] [http://localhost:3500/auth/change-password]

пример body:

```sh
		"oldPassword": "password",
		"newPassword": "new password"
```

Для совершения покупки [POST] [http://localhost:3500/purchase]

в body указать товар и количество

```sh
		"productId": 2,
		"quantity": 1
```

Для отображения массива объектов с двумя минимальными ценами на предмет (одна цена — tradable, другая — нет) через API: [https://docs.skinport.com/#items] - [GET] [http://localhost:3500/api/items-with-prices]

кеширование через redis на 5 минут
