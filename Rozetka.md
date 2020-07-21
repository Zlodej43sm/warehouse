[Тecтовый виджет на сайте Розетка] (http://seller.rozetka.com.ua/cartframe/)
[Корзина на Розетке без Аякса] (https://my.rozetka.com.ua/profile/cart/)
[Получить новую заявку] (http://seller.rozetka.com.ua/api/order?ext_id=test_vitalik1111)

# Таблица External

- содержит идентификаторы внутренние (ObjectId или строка) и полученные
из других приложений для связи (Розетка и возможно другие)
- ключи: наименование идентификатор партнера, наименование таблицы, идентификатор
объекта
- партнера берем Розетку даже если Розетка использует сеть приемных пунктов
Техносток (обоснование: могут быть несколько партнеров которые используют сеть
приемных пунктов Техносток)
- некторые объекты не имеют самостоятельно таблицы в Техностоке и хранятся
как прстой текст (например города). Ключ для связи формируем по принципу:
имя-таблицы_имя-поля, и в качестве идентификатора строку с наименованием
(не идентификатор)
- города у Розетки могут повторяться (в основном Киев и пгт - берем
с минимальным значением идентификатора)


# Статусы изменения заявок  (согласованы предварительно)

'new' - Новый заказ (1)
'estimate' - Новый заказ (1)
'estimated' - Обрабатывается менеджером (26)
'confirmed' - Обрабатывается менеджером (26)
'rejected' - Отменён Администратором (13)
'autocancel' - Не удалось связаться с покупателем (18)
'complete' - Посылка получена (6)

# Таблица Queue

- отслеживает синхронризацию внутренних таблиц с внешними данными (например Розетки)
- содержит список измененных объектов в коллекциях
- ключи: наименование идентификатор партнера, наименование таблицы, идентификатор
объекта
- если локальный объект и внешний объект (например в базе данных Розетки) совпадают
запись удаляется, в противном случае формируте ся запрос на обновление внешних данных