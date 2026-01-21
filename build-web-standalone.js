/**
 * Скрипт для создания standalone HTML файла из Cocos Creator билда
 * Использование: node build-web-standalone.js
 * 
 * ВНИМАНИЕ: Этот скрипт создает один HTML файл, но он может быть очень большим
 * и может не работать из-за ограничений браузера и динамической загрузки ресурсов Cocos Creator
 */

const fs = require('fs');
const path = require('path');

const BUILD_DIR = path.join(__dirname, 'build', 'web-desktop');
const OUTPUT_FILE = path.join(__dirname, 'build', 'standalone.html');

function readFile(filePath) {
    try {
        return fs.readFileSync(filePath, 'utf-8');
    } catch (err) {
        console.warn(`Не удалось прочитать файл: ${filePath}`);
        return '';
    }
}

function readFileBinary(filePath) {
    try {
        return fs.readFileSync(filePath);
    } catch (err) {
        console.warn(`Не удалось прочитать бинарный файл: ${filePath}`);
        return null;
    }
}

function base64Encode(filePath) {
    const data = readFileBinary(filePath);
    if (!data) return '';
    return data.toString('base64');
}

function getAllFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            getAllFiles(filePath, fileList);
        } else {
            fileList.push(filePath);
        }
    });
    return fileList;
}

function createStandaloneHTML() {
    console.log('Начинаю создание standalone HTML файла...');
    
    if (!fs.existsSync(BUILD_DIR)) {
        console.error(`Папка билда не найдена: ${BUILD_DIR}`);
        console.log('Сначала создайте билд через Cocos Creator: Project → Build...');
        return;
    }

    // Читаем основной HTML файл
    const htmlContent = readFile(path.join(BUILD_DIR, 'index.html'));
    const cssContent = readFile(path.join(BUILD_DIR, 'style.css'));
    
    // Читаем JS файлы
    const polyfillsJS = readFile(path.join(BUILD_DIR, 'src', 'polyfills.bundle.js'));
    const systemJS = readFile(path.join(BUILD_DIR, 'src', 'system.bundle.js'));
    const bundleJS = readFile(path.join(BUILD_DIR, 'src', 'chunks', 'bundle.js'));
    const indexJS = readFile(path.join(BUILD_DIR, 'index.js'));
    const applicationJS = readFile(path.join(BUILD_DIR, 'application.js'));
    
    // Читаем import-map.json
    const importMap = readFile(path.join(BUILD_DIR, 'src', 'import-map.json'));
    
    // Создаем новый HTML с встроенными ресурсами
    let standaloneHTML = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Cocos Creator | PlayBox</title>
    <meta name="viewport" content="width=device-width,user-scalable=no,initial-scale=1,minimum-scale=1,maximum-scale=1,minimal-ui=true"/>
    <meta name="apple-mobile-web-app-capable" content="yes"/>
    <meta name="mobile-web-app-capable" content="yes"/>
    <meta name="full-screen" content="yes"/>
    <meta name="screen-orientation" content="portrait"/>
    <meta name="x5-fullscreen" content="true"/>
    <meta name="360-fullscreen" content="true"/>
    <meta name="renderer" content="webkit"/>
    <meta name="force-rendering" content="webkit"/>
    <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1"/>
    
    <style>
${cssContent}
    </style>
  </head>
  <body>
    <h1 class="header">PlayBox</h1>
    <div id="GameDiv" cc_exact_fit_screen="false" style="width: 1280px; height: 960px;">
      <div id="Cocos3dGameContainer">
        <canvas id="GameCanvas" width="1280" height="960" tabindex="99"></canvas>
      </div>
    </div>
    <p class="footer">
      Created with <a href="https://www.cocos.com/products" title="Cocos Creator">Cocos Creator</a>
    </p>
    
    <script>
// Встроенный polyfills bundle
${polyfillsJS}
    </script>
    
    <script>
// Встроенный SystemJS
${systemJS}
    </script>
    
    <script type="systemjs-importmap">
// Встроенный import map
${importMap}
    </script>
    
    <script>
// Встроенный bundle
${bundleJS}
    </script>
    
    <script>
// Встроенный application.js
${applicationJS}
    </script>
    
    <script>
// Встроенный index.js
${indexJS}
    </script>
    
    <script>
// Запуск игры
try {
    System.import('./index.js').catch(function(err) { 
        console.error('Ошибка загрузки:', err); 
    });
} catch (err) {
    console.error('Ошибка инициализации:', err);
}
    </script>
  </body>
</html>`;

    // Сохраняем файл
    fs.writeFileSync(OUTPUT_FILE, standaloneHTML, 'utf-8');
    
    const fileSize = fs.statSync(OUTPUT_FILE).size;
    const fileSizeMB = (fileSize / (1024 * 1024)).toFixed(2);
    
    console.log(`\n✓ Standalone HTML файл создан: ${OUTPUT_FILE}`);
    console.log(`  Размер файла: ${fileSizeMB} MB`);
    console.log(`\n⚠️  ВНИМАНИЕ:`);
    console.log(`  - Этот файл может не работать полностью из-за динамической загрузки ресурсов Cocos Creator`);
    console.log(`  - Ресурсы (изображения, звуки) все еще могут загружаться из внешних файлов`);
    console.log(`  - Рекомендуется использовать ZIP архив всей папки build/web-desktop`);
    console.log(`\n📦 Для отправки используйте: build/web-desktop (весь каталог)`);
}

// Запускаем создание
createStandaloneHTML();
