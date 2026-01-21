# Исправление ошибок 404 на GitHub Pages

## Проблема

Получаете ошибки 404 при загрузке изображений:
```
GET https://nekrogamedev.github.io/assets/main/native/c5/c55a1ed9-6086-4f6a-9a76-660cabb35f07.png 404 (Not Found)
```

## Причины

1. **Файлы не закоммичены** в папку `docs/` или корень репозитория
2. **Неправильный базовый путь** - GitHub Pages использует путь вида `/repository-name/` как базовый
3. **Структура папок не соответствует** ожидаемой

## Решение

### Вариант 1: Проверить и скопировать все файлы в docs/

```bash
# Убедитесь, что билд собран
# Затем скопируйте все файлы в docs/
rm -rf docs
cp -r build/web-desktop docs
touch docs/.nojekyll

# Проверьте, что файлы скопированы
ls docs/assets/main/native/c5/ | head -5

# Добавьте в git
git add docs/
git commit -m "Copy all build files to docs"
git push
```

### Вариант 2: Настроить базовый путь в Cocos Creator

Если ваш репозиторий называется `NekroGameDev.github.io`, то базовый путь должен быть `/`.

Если репозиторий называется по-другому (например, `PlayBox`), то базовый путь должен быть `/PlayBox/`.

**В Cocos Creator:**

1. Откройте **Project → Build**
2. Найдите настройку **Base URL** или **Asset Server**
3. Установите:
   - Для `username.github.io`: `/` (корень)
   - Для других репозиториев: `/repository-name/` (имя вашего репозитория)

### Вариант 3: Использовать относительные пути (Рекомендуется)

Cocos Creator по умолчанию использует относительные пути, что правильно. Проблема скорее всего в том, что файлы не закоммичены.

## Проверка

### 1. Проверьте, что все файлы в git:

```bash
# Если используете docs/
git ls-files docs/assets/main/native/ | wc -l

# Должно быть много файлов (десятки/сотни)
```

### 2. Проверьте структуру в GitHub:

1. Откройте ваш репозиторий на GitHub
2. Перейдите в папку `docs/assets/main/native/c5/` (или корень, если используете корень)
3. Убедитесь, что файлы там есть

### 3. Проверьте локально:

```bash
cd docs  # или корень репозитория
python3 -m http.server 8000
```

Откройте `http://localhost:8000` и проверьте консоль браузера (F12).

## Быстрое решение

```bash
# 1. Убедитесь, что билд собран
# 2. Скопируйте все файлы в docs/
rm -rf docs
cp -r build/web-desktop docs
touch docs/.nojekyll

# 3. Проверьте количество файлов
find docs/assets/main/native -type f | wc -l
# Должно быть много файлов

# 4. Добавьте в git
git add docs/
git status  # Проверьте, что все файлы добавлены

# 5. Закоммитьте и запушьте
git commit -m "Fix: Add all build files to docs"
git push

# 6. Подождите 2-5 минут и проверьте сайт
```

## Если проблема останется

1. **Проверьте настройки GitHub Pages:**
   - Settings → Pages
   - Source: `Deploy from a branch`
   - Branch: ваша ветка
   - Folder: `/docs` (или `/` если используете корень)

2. **Проверьте логи GitHub Actions:**
   - Actions → Последний workflow
   - Ищите ошибки

3. **Проверьте консоль браузера:**
   - Откройте DevTools (F12)
   - Network tab → проверьте, какие файлы не загружаются
   - Console tab → проверьте ошибки

4. **Проверьте базовый путь:**
   - Если репозиторий не `username.github.io`, возможно нужно настроить базовый путь в Cocos Creator
