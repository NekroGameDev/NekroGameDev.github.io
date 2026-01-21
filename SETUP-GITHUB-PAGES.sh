#!/bin/bash

# Скрипт для настройки GitHub Pages для Cocos Creator проекта

echo "🚀 Настройка GitHub Pages для Cocos Creator проекта"
echo ""

# Проверяем, существует ли билд
if [ ! -d "build/web-desktop" ]; then
    echo "❌ Ошибка: Папка build/web-desktop не найдена!"
    echo "   Сначала соберите проект в Cocos Creator (Project → Build)"
    exit 1
fi

echo "✅ Билд найден в build/web-desktop"
echo ""

# Спрашиваем, какой вариант использовать
echo "Выберите вариант настройки:"
echo "1) Использовать папку docs/ (рекомендуется для GitHub Pages)"
echo "2) Использовать корень репозитория"
echo ""
read -p "Ваш выбор (1 или 2): " choice

case $choice in
    1)
        echo ""
        echo "📁 Настройка папки docs/..."
        
        # Удаляем старую папку docs, если есть
        if [ -d "docs" ]; then
            echo "⚠️  Удаляю старую папку docs..."
            rm -rf docs
        fi
        
        # Копируем билд в docs
        echo "📋 Копирую билд в docs/..."
        cp -r build/web-desktop docs
        
        # Создаем .nojekyll в docs
        echo "🚫 Создаю .nojekyll в docs/..."
        touch docs/.nojekyll
        
        echo ""
        echo "✅ Готово! Папка docs/ настроена."
        echo ""
        echo "📝 Следующие шаги:"
        echo "1. git add docs/"
        echo "2. git commit -m 'Setup GitHub Pages with docs folder'"
        echo "3. git push"
        echo "4. В GitHub: Settings → Pages → Source: Deploy from a branch → Folder: /docs"
        ;;
    2)
        echo ""
        echo "📁 Настройка корня репозитория..."
        
        # Создаем .nojekyll в корне
        echo "🚫 Создаю .nojekyll в корне..."
        touch .nojekyll
        
        echo ""
        echo "⚠️  ВНИМАНИЕ: Этот вариант скопирует файлы билда в корень репозитория."
        echo "   Это может перезаписать существующие файлы!"
        read -p "Продолжить? (y/n): " confirm
        
        if [ "$confirm" != "y" ]; then
            echo "❌ Отменено."
            exit 1
        fi
        
        # Копируем файлы из билда в корень
        echo "📋 Копирую файлы билда в корень..."
        cp -r build/web-desktop/* .
        
        echo ""
        echo "✅ Готово! Корень репозитория настроен."
        echo ""
        echo "📝 Следующие шаги:"
        echo "1. git add ."
        echo "2. git commit -m 'Setup GitHub Pages in root'"
        echo "3. git push"
        echo "4. В GitHub: Settings → Pages → Source: Deploy from a branch → Folder: / (root)"
        ;;
    *)
        echo "❌ Неверный выбор. Выход."
        exit 1
        ;;
esac

echo ""
echo "🎉 Настройка завершена!"
