# Быстрая инструкция по настройке билда Cocos Creator

## ✅ Правильные настройки билда

### В Cocos Creator (Project → Build):

1. **Platform**: `Web Desktop`
2. **Build Path**: `build/web-desktop`
3. **Start Scene**: `assets/Game.scene`

### Рекомендуемые опции:

- ✅ **MD5 Cache**: ON
- ✅ **Merge JSON**: ON  
- ✅ **Compress Texture**: ON
- ❌ **Source Maps**: OFF (для продакшена)
- ❌ **Separate Engine**: OFF
- ❌ **Inline SpriteFrames**: OFF

## 🔍 Проверка после билда

После билда проверьте наличие файлов:

```bash
cd build/web-desktop
ls -la
```

Должны быть:
- ✅ `index.html`
- ✅ `index.js`
- ✅ `application.js`
- ✅ `style.css`
- ✅ `src/` (папка)
- ✅ `assets/` (папка)
- ✅ `cocos-js/` (папка, если Separate Engine включен)

## 🧪 Локальное тестирование

Перед деплоем протестируйте локально:

```bash
cd build/web-desktop
python3 -m http.server 8000
# или
npx serve .
```

Откройте: `http://localhost:8000`

## 📦 Подготовка к деплою

1. **Убедитесь, что все файлы в git:**
   ```bash
   git add build/web-desktop/
   git status
   ```

2. **Проверьте .gitignore:**
   ```
   build/*
   !build/web-desktop/
   ```

3. **Закоммитьте и запушьте:**
   ```bash
   git commit -m "Update build"
   git push
   ```

## ⚙️ Настройки Vercel

- **Root Directory**: `build/web-desktop`
- **Output Directory**: `.` (точка, toggle ON)
- **Build Command**: OFF
- **Install Command**: OFF

## ❌ Частые ошибки

1. **404 ошибки**: Проверьте, что все файлы закоммичены
2. **WASM не загружается**: Проверьте `vercel.json` - должны быть правильные headers
3. **Игра не запускается**: Откройте DevTools (F12) и проверьте консоль

## 📝 Полная инструкция

Смотрите `COCOS-BUILD-GUIDE.md` для подробной информации.
