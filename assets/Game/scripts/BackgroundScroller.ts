import { _decorator, Component, Node, UITransform, view } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('BackgroundScroller')
export class BackgroundScroller extends Component {
    @property
    scrollSpeed: number = 2; // Скорость прокрутки (должна совпадать с gameSpeed)

    @property(Node)
    secondBackground: Node = null!; // Второй спрайт фона (добавьте вручную в Inspector)

    private backgroundTiles: Node[] = [];
    private tileWidth: number = 0;
    private isScrolling: boolean = false;

    start() {
        console.log('[BackgroundScroller] start() called');
        this.initBackground();
    }

    private initBackground() {
        // Получаем размеры экрана
        const visibleSize = view.getVisibleSize();
        const canvasTransform = this.node.getComponent(UITransform);
        
        if (!canvasTransform) {
            console.error('[BackgroundScroller] UITransform not found on Background node!');
            return;
        }

        // Используем ширину UITransform для расчета
        this.tileWidth = canvasTransform.width;
        
        // Собираем все тайлы фона
        // Первый тайл - это сам узел Background
        this.backgroundTiles.push(this.node);
        
        // Второй тайл - если указан в Inspector
        if (this.secondBackground) {
            this.backgroundTiles.push(this.secondBackground);
            console.log('[BackgroundScroller] Second background found:', this.secondBackground.name);
        } else {
            // Пытаемся найти второй Background автоматически (например, Background2 или BackgroundTile)
            const parent = this.node.parent;
            if (parent) {
                const siblings = parent.children;
                for (let i = 0; i < siblings.length; i++) {
                    const sibling = siblings[i];
                    if (sibling !== this.node && 
                        (sibling.name.includes('Background') || sibling.name.includes('Tile'))) {
                        this.backgroundTiles.push(sibling);
                        console.log('[BackgroundScroller] Found background tile automatically:', sibling.name);
                        break;
                    }
                }
            }
        }

        // Если нашли только один тайл, предупреждаем
        if (this.backgroundTiles.length < 2) {
            console.warn('[BackgroundScroller] Found only', this.backgroundTiles.length, 'background tile(s). Add a second background sprite for seamless scrolling!');
        }

        console.log('[BackgroundScroller] Initialized', this.backgroundTiles.length, 'background tiles, tileWidth:', this.tileWidth);

        console.log('[BackgroundScroller] Initialized', this.backgroundTiles.length, 'background tiles, tileWidth:', this.tileWidth);
    }

    public startScrolling() {
        console.log('[BackgroundScroller] Starting scroll');
        this.isScrolling = true;
    }

    public stopScrolling() {
        console.log('[BackgroundScroller] Stopping scroll');
        this.isScrolling = false;
    }

    public setScrollSpeed(speed: number) {
        this.scrollSpeed = speed;
    }

    update(deltaTime: number) {
        if (!this.isScrolling || this.backgroundTiles.length === 0 || this.tileWidth === 0) return;

        // Скорость в пикселях в секунду (deltaTime уже в секундах)
        const moveDistance = this.scrollSpeed * deltaTime * 60;

        // Получаем размеры видимой области
        const visibleSize = view.getVisibleSize();
        const leftScreenEdge = -visibleSize.width / 2;

        // Сначала обновляем позиции всех тайлов
        for (let i = 0; i < this.backgroundTiles.length; i++) {
            const tile = this.backgroundTiles[i];
            if (!tile || !tile.isValid) continue;

            const currentPos = tile.getPosition();
            const newX = currentPos.x - moveDistance;
            tile.setPosition(newX, currentPos.y, currentPos.z);
        }

        // Затем проверяем и перемещаем тайлы, которые ушли за экран
        // Обрабатываем их несколько раз, пока все не будут правильно расположены
        // Это нужно, чтобы когда один тайл переместился, следующий мог использовать его новую позицию
        let needsRepositioning = true;
        let iterations = 0;
        const maxIterations = 10; // Защита от бесконечного цикла
        
        while (needsRepositioning && iterations < maxIterations) {
            needsRepositioning = false;
            iterations++;
            
            // Сортируем тайлы по позиции X (от левого к правому) для последовательной обработки
            const tilesWithPositions = this.backgroundTiles
                .map((tile, index) => {
                    if (!tile || !tile.isValid) return null;
                    const pos = tile.getPosition();
                    return { tile, index, x: pos.x };
                })
                .filter(item => item !== null)
                .sort((a, b) => a!.x - b!.x);
            
            // Обрабатываем тайлы слева направо
            for (const item of tilesWithPositions) {
                if (!item) continue;
                
                const tile = item.tile;
                const tileTransform = tile.getComponent(UITransform);
                if (!tileTransform) continue;

                const currentPos = tile.getPosition();
                
                // Вычисляем границы тайла с учетом anchor point
                const anchorX = tileTransform.anchorPoint.x;
                const rightEdge = currentPos.x + (this.tileWidth * (1 - anchorX));

                // Проверяем: если ПРАВЫЙ край тайла ушел за ЛЕВУЮ границу экрана
                // Перемещаем его вправо от самого правого тайла
                if (rightEdge <= leftScreenEdge) {
                    // Находим самый правый тайл (с максимальным правым краем)
                    // Используем актуальные позиции после всех предыдущих перемещений
                    let rightmostRightEdge = -Infinity;
                    for (let j = 0; j < this.backgroundTiles.length; j++) {
                        const otherTile = this.backgroundTiles[j];
                        if (otherTile !== tile && otherTile && otherTile.isValid) {
                            const otherTransform = otherTile.getComponent(UITransform);
                            if (otherTransform) {
                                const otherPos = otherTile.getPosition();
                                const otherAnchorX = otherTransform.anchorPoint.x;
                                const otherRightEdge = otherPos.x + (this.tileWidth * (1 - otherAnchorX));
                                if (otherRightEdge > rightmostRightEdge) {
                                    rightmostRightEdge = otherRightEdge;
                                }
                            }
                        }
                    }
                    
                    // Если не нашли других тайлов, используем текущий правый край
                    if (rightmostRightEdge === -Infinity) {
                        rightmostRightEdge = rightEdge;
                    }
                    
                    // Перемещаем тайл так, чтобы его ЛЕВЫЙ край был на ПРАВОМ краю самого правого тайла
                    // Это создает бесшовное соединение: leftEdge_new = rightmostRightEdge
                    // newX - (tileWidth * anchorX) = rightmostRightEdge
                    // newX = rightmostRightEdge + (tileWidth * anchorX)
                    const newTileX = rightmostRightEdge + (this.tileWidth * anchorX);
                    tile.setPosition(newTileX, currentPos.y, currentPos.z);
                    needsRepositioning = true; // Продолжаем проверку, так как позиции изменились
                }
            }
        }
    }
}
