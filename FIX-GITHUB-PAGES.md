# Исправление ошибок 404 на GitHub Pages

## ✅ Проблема найдена!

**Проблема:** Файлы изображений не закоммичены в git.

- Локально в `docs/assets/main/native/`: **29 файлов**
- В git: **0 файлов**

## Решение

### Шаг 1: Добавить все файлы в git

```bash
cd /Users/maksimmamusin/Documents/PlayBox
git add docs/
git status  # Проверьте, что все файлы добавлены
```

### Шаг 2: Закоммитьте изменения

```bash
git commit -m "Fix: Add all build files including images to docs"
```

### Шаг 3: Запушьте в репозиторий

```bash
git push
```

### Шаг 4: Проверьте количество файлов

После добавления проверьте:

```bash
git ls-files docs/assets/main/native/ | wc -l
```

Должно быть **29 файлов** (или больше, если есть другие файлы).

### Шаг 5: Подождите и проверьте сайт

1. Подождите **2-5 минут** (GitHub Pages обновляется не мгновенно)
2. Откройте ваш сайт: `https://nekrogamedev.github.io/`
3. Откройте DevTools (F12) → Network tab
4. Проверьте, что файлы загружаются без ошибок 404

## Проверка

После пуша проверьте на GitHub:

1. Откройте ваш репозиторий на GitHub
2. Перейдите в папку `docs/assets/main/native/c5/`
3. Убедитесь, что файлы там есть

## Если проблема останется

1. **Очистите кэш браузера:**
   - Chrome: `Cmd+Shift+Delete` (Mac) / `Ctrl+Shift+Delete` (Windows)
   - Или откройте в режиме инкогнито

2. **Проверьте логи GitHub Actions:**
   - Actions → Последний workflow
   - Ищите ошибки

3. **Проверьте настройки GitHub Pages:**
   - Settings → Pages
   - Source: `Deploy from a branch`
   - Branch: ваша ветка
   - Folder: `/docs`

## Почему это произошло?

Возможно, при копировании файлов в `docs/` они не были добавлены в git, или `.gitignore` их игнорировал. Убедитесь, что в `.gitignore` нет правил, которые игнорируют `docs/`.
