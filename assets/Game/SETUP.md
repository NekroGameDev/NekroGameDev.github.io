# Инструкция по настройке игры в Cocos Creator

## Шаг 1: Импорт ассетов

1. Откройте Cocos Creator 3.8.8
2. Откройте проект `/Users/maksimmamusin/Documents/PlayBox`
3. В папке `assets/Game/images/` уже должны быть все изображения
4. Если изображения не видны, обновите проект (F5) или перезапустите Cocos Creator

## Шаг 2: Создание сцены

1. Создайте новую сцену: `File > New Scene` или `Ctrl+N`
2. Сохраните как `Game.scene` в `assets/Game/`

## Шаг 3: Настройка Canvas

1. Выберите Canvas в иерархии
2. В Inspector установите:
   - Design Resolution: 375 x 812
   - Fit Height: ✅
   - Fit Width: ✅

## Шаг 4: Создание структуры сцены

Создайте следующую структуру узлов:

```
Canvas
├── Background (Sprite)
│   └── Sprite Component с фоном (00d671b05eb1.webp)
├── GameManager (Node)
│   └── GameManager Component
├── Player (Sprite)
│   ├── Sprite Component с персонажем (6feafd658ed5.png)
│   └── PlayerController Component
├── ObstacleContainer (Node)
│   └── (для динамически создаваемых препятствий)
└── UI (Node)
    ├── ScoreLabel (Label)
    │   └── Label Component: "$0"
    ├── HealthUI (Node)
    │   └── HealthUI Component
    ├── TutorialUI (Node)
    │   └── TutorialLabel (Label)
    │       └── TutorialUI Component
    ├── MuteButton (Button)
    │   └── MuteButton Component
    ├── StartScreen (Node)
    │   ├── Title (Label): "Tap to Start Earning!"
    │   └── StartButton (Button)
    └── GameOverScreen (Node)
        ├── Title (Label): "Game Over"
        ├── FinalScoreLabel (Label): "Score: $0"
        └── RestartButton (Button)
```

## Шаг 5: Настройка GameManager

1. Выберите узел `GameManager`
2. Добавьте компонент `GameManager`
3. В Inspector назначьте ссылки:
   - Start Screen → узел `StartScreen`
   - Game Over Screen → узел `GameOverScreen`
   - Score Label → узел `ScoreLabel`
   - Final Score Label → узел `FinalScoreLabel`
   - Player → узел `Player`
   - Obstacle Container → узел `ObstacleContainer`
   - Obstacle Prefab → создайте префаб препятствия (см. ниже)
   - Player Sprite → SpriteFrame из `6feafd658ed5.png`
   - Obstacle Sprite → SpriteFrame из `518cb2af8bcd.png`
   - Background Sprite → SpriteFrame из `00d671b05eb1.webp`

## Шаг 6: Создание префаба препятствия

1. Создайте новый Node: `Obstacle`
2. Добавьте Sprite Component с изображением `518cb2af8bcd.png`
3. Установите размер: Width: 40, Height: 60
4. Перетащите в папку `assets/Game/` для создания префаба
5. Назначьте этот префаб в GameManager

## Шаг 7: Настройка PlayerController

1. Выберите узел `Player`
2. Добавьте компонент `PlayerController`
3. Настройте параметры:
   - Jump Height: 200
   - Jump Duration: 0.5

## Шаг 8: Настройка HealthUI

1. Выберите узел `HealthUI`
2. Добавьте компонент `HealthUI`
3. Создайте SpriteFrame для сердца (можно использовать эмодзи ❤️ или спрайт)
4. Назначьте в Heart Sprite

## Шаг 9: Настройка TutorialUI

1. Выберите узел `TutorialUI`
2. Добавьте компонент `TutorialUI`
3. Выберите дочерний `TutorialLabel`
4. Назначьте в Tutorial Label

## Шаг 10: Настройка MuteButton

1. Выберите узел `MuteButton`
2. Добавьте компонент `MuteButton`
3. Создайте два SpriteFrame для иконок:
   - Mute Icon (🔇)
   - Unmute Icon (🔊)
4. Назначьте в компоненте

## Шаг 11: Настройка кнопок

1. **StartButton**:
   - Добавьте событие `Click` → `GameManager.startGame()`

2. **RestartButton**:
   - Добавьте событие `Click` → `GameManager.restartGame()`

3. **MuteButton**:
   - Событие уже обрабатывается в компоненте

## Шаг 12: Настройка ввода

1. Выберите Canvas
2. Добавьте обработчик событий для тапа/клика
3. Или используйте встроенный Input Manager Cocos Creator

## Готово!

Теперь вы можете запустить игру и протестировать её. Все компоненты готовы и должны работать вместе.

## Примечания

- Убедитесь, что все SpriteFrame созданы из изображений
- Проверьте, что все ссылки в компонентах назначены правильно
- Если что-то не работает, проверьте консоль на ошибки
