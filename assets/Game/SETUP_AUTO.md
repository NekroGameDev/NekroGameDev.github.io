# Инструкция по настройке сцены в Cocos Creator

## Автоматическая настройка выполнена!

Скрипт создал:
- ✅ Файл сцены: `assets/Game/Game.scene`
- ✅ Префаб препятствия: `assets/Game/Obstacle.prefab`
- ✅ Все узлы и компоненты настроены

## Следующие шаги:

### 1. Откройте Cocos Creator 3.8.8
   - Откройте проект `/Users/maksimmamusin/Documents/PlayBox`
   - Дождитесь завершения импорта ассетов

### 2. Откройте сцену
   - В Project панели найдите `assets/Game/Game.scene`
   - Дважды кликните для открытия

### 3. Настройте ссылки в GameManager
   - Выберите узел `GameManager` в иерархии
   - В Inspector назначьте ссылки:
     * Start Screen → узел `UI/StartScreen`
     * Game Over Screen → узел `UI/GameOverScreen`
     * Score Label → узел `UI/ScoreLabel`
     * Final Score Label → узел `UI/GameOverScreen/FinalScoreLabel`
     * Player → узел `Player`
     * Obstacle Container → узел `ObstacleContainer`
     * Obstacle Prefab → префаб `Obstacle.prefab`
     * Player Sprite → SpriteFrame из `6feafd658ed5.png`
     * Obstacle Sprite → SpriteFrame из `518cb2af8bcd.png`
     * Background Sprite → SpriteFrame из `00d671b05eb1.webp`

### 4. Настройте HealthUI
   - Выберите узел `UI/HealthUI`
   - В Inspector назначьте Heart Sprite (можно использовать любой спрайт или создать простой)

### 5. Настройте TutorialUI
   - Выберите узел `UI/TutorialUI`
   - В Inspector назначьте Tutorial Label → узел `TutorialLabel`

### 6. Настройте MuteButton
   - Выберите узел `UI/MuteButton`
   - Создайте два SpriteFrame для иконок (🔇 и 🔊) или используйте существующие
   - Назначьте Mute Icon и Unmute Icon

### 7. Настройте кнопки
   - **StartButton**: Добавьте событие Click → GameManager.startGame()
   - **RestartButton**: Добавьте событие Click → GameManager.restartGame()

### 8. Настройка Canvas
   - Выберите Canvas
   - Design Resolution: 375 x 812
   - Fit Height: ✅
   - Fit Width: ✅

### 9. Настройка ввода
   - PlayerController автоматически обрабатывает тапы и пробел
   - Убедитесь, что Canvas имеет правильные настройки для мобильных устройств

## Готово!

Теперь вы можете запустить игру и протестировать её.

## Примечания

- Если какие-то ссылки не назначены, Cocos Creator покажет предупреждения
- Все компоненты уже созданы и настроены
- Проверьте консоль на наличие ошибок при запуске
