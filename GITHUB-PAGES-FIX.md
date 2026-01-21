# Исправление ошибки GitHub Pages с Jekyll

## Проблема

GitHub Pages по умолчанию пытается обработать ваш проект через Jekyll, но проект Cocos Creator - это статический сайт, который не нужно обрабатывать.

**Ошибка:**
```
No such file or directory @ dir_chdir0 - /github/workspace/docs
```

## Решение

### Вариант 1: Отключить Jekyll (Рекомендуется)

1. **Создайте файл `.nojekyll` в корне репозитория**

   Этот файл говорит GitHub Pages не использовать Jekyll для обработки сайта.

   ```bash
   touch .nojekyll
   git add .nojekyll
   git commit -m "Disable Jekyll for GitHub Pages"
   git push
   ```

2. **Если используете папку `docs/`, создайте `.nojekyll` там:**

   ```bash
   touch docs/.nojekyll
   git add docs/.nojekyll
   git commit -m "Disable Jekyll in docs folder"
   git push
   ```

### Вариант 2: Настроить GitHub Pages правильно

1. **Идите в настройки репозитория:**
   - GitHub → Settings → Pages

2. **Выберите источник:**
   - Если билд в `build/web-desktop/`:
     - **Source**: `Deploy from a branch`
     - **Branch**: выберите вашу ветку (обычно `main` или `master`)
     - **Folder**: `/build/web-desktop` (если такая опция есть)
   
   - ИЛИ скопируйте содержимое `build/web-desktop/` в корень репозитория или в папку `docs/`

3. **Сохраните настройки**

## Рекомендуемая структура для GitHub Pages

### Вариант A: Использовать папку `docs/`

1. **Скопируйте билд в папку `docs/`:**

   ```bash
   # Удалите старую папку docs, если есть
   rm -rf docs
   
   # Скопируйте билд
   cp -r build/web-desktop docs
   
   # Создайте .nojekyll
   touch docs/.nojekyll
   
   # Добавьте в git
   git add docs/
   git commit -m "Setup GitHub Pages with docs folder"
   git push
   ```

2. **В настройках GitHub Pages:**
   - **Source**: `Deploy from a branch`
   - **Branch**: `main` (или ваша ветка)
   - **Folder**: `/docs`

### Вариант B: Использовать корень репозитория

1. **Скопируйте билд в корень:**

   ```bash
   # Скопируйте все файлы из build/web-desktop в корень
   cp -r build/web-desktop/* .
   
   # Создайте .nojekyll
   touch .nojekyll
   
   # Добавьте в git
   git add .
   git commit -m "Setup GitHub Pages in root"
   git push
   ```

2. **В настройках GitHub Pages:**
   - **Source**: `Deploy from a branch`
   - **Branch**: `main` (или ваша ветка)
   - **Folder**: `/ (root)`

### Вариант C: Использовать GitHub Actions (Продвинутый)

Создайте `.github/workflows/deploy-pages.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Copy build to docs
        run: |
          cp -r build/web-desktop/* docs/
          touch docs/.nojekyll
      
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./docs
```

## Быстрое решение (Рекомендуется)

1. **Создайте файл `.nojekyll` в корне:**

   ```bash
   touch .nojekyll
   ```

2. **Если используете папку `docs/`, создайте там:**

   ```bash
   mkdir -p docs
   touch docs/.nojekyll
   ```

3. **Закоммитьте и запушьте:**

   ```bash
   git add .nojekyll
   # или
   git add docs/.nojekyll
   
   git commit -m "Disable Jekyll for GitHub Pages"
   git push
   ```

4. **Проверьте настройки GitHub Pages:**
   - Убедитесь, что указана правильная папка
   - Если используете `docs/`, убедитесь, что она существует и содержит билд

## Проверка

После применения исправления:

1. Подождите несколько минут (GitHub Pages обновляется не мгновенно)
2. Откройте ваш сайт: `https://yourusername.github.io/repository-name/`
3. Проверьте консоль браузера (F12) на ошибки

## Дополнительные настройки

### Если используете кастомный домен

Добавьте файл `CNAME` в корень (или в `docs/`, если используете эту папку):

```
yourdomain.com
```

### Если нужны правильные MIME типы

GitHub Pages обычно правильно определяет MIME типы, но если есть проблемы с WASM файлами, убедитесь, что `.nojekyll` создан.

## Частые ошибки

1. **404 ошибки**: Убедитесь, что все файлы закоммичены
2. **Jekyll все еще работает**: Проверьте, что `.nojekyll` создан и закоммичен
3. **Файлы не обновляются**: Подождите несколько минут, GitHub Pages кэширует
