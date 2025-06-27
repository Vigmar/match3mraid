import { Sprite, Graphics } from "pixi.js";
import { gsap } from "gsap";

import { showInstallPopup } from "./install-popup";
import { resetHintTimer } from "./hint";
import { gameState } from "./game-state.js";
import { config } from "./config.js";
import { findPossibleMove, findMatches, reshuffleBoard } from "./logic.js";
import { setScore } from "./score-ui.js";

export function initBoard() {
  gameState.tileContainer.removeChildren();
  gameState.board = [];

  // Создание нового поля
  for (let row = 0; row < config.rows; row++) {
    gameState.board[row] = [];
    for (let col = 0; col < config.columns; col++) {
      // Выбор типа элемента, чтобы избежать состояния 3 в ряд на старте
      let tileType;
      do {
        tileType = Math.floor(Math.random() * config.tileTypes);
      } while (
        (row >= 2 &&
          gameState.board[row - 1][col].type === tileType &&
          gameState.board[row - 2][col].type === tileType) ||
        (col >= 2 &&
          gameState.board[row][col - 1] &&
          gameState.board[row][col - 1].type === tileType &&
          gameState.board[row][col - 2].type === tileType)
      );

      const tile = createTile(row, col, tileType);

      gameState.board[row][col] = tile;
      gameState.tileContainer.addChild(tile.sprite);
    }
  }

  resetHintTimer();
}

// Create a tile sprite
export function createTile(row, col, type) {
  const tile = {
    row,
    col,
    type,
    sprite: new Sprite(gameState.tileTextures[type]),
  };

  tile.sprite.x = col * (config.tileSize + config.tileSpacing);
  tile.sprite.y = row * (config.tileSize + config.tileSpacing);

  tile.sprite.interactive = true;
  tile.sprite.buttonMode = true;
  setupDragHandlers(tile);

  return tile;
}

// Меняем элементы местами
export function swapTiles(tile1, tile2) {
  gameState.isAnimating = true;

  const tile1X = tile1.col * (config.tileSize + config.tileSpacing);
  const tile1Y = tile1.row * (config.tileSize + config.tileSpacing);

  const tile2X = tile2.col * (config.tileSize + config.tileSpacing);
  const tile2Y = tile2.row * (config.tileSize + config.tileSpacing);

  // Меняем местами элементы доски, а также row и col для самих элементов
  [
    gameState.board[tile1.row][tile1.col],
    gameState.board[tile2.row][tile2.col],
  ] = [
    gameState.board[tile2.row][tile2.col],
    gameState.board[tile1.row][tile1.col],
  ];

  [tile1.row, tile2.row] = [tile2.row, tile1.row];
  [tile1.col, tile2.col] = [tile2.col, tile1.col];

  gameState.isAnimating = true;

  const swapTl = gsap.timeline({
    onComplete: () => {
      // Проверяем совпадения после завершения анимации
      const matches = findMatches();

      if (matches.length > 0) {
        processMatches(matches);
      } else {
        // Если совпадений нет - возвращаем плитки обратно
        const revertTl = gsap.timeline();
        revertTl
          .to(tile1.sprite, {
            x: tile1X,
            y: tile1Y,
            duration: config.swapSpeed,
            ease: "power2.out",
          })
          .to(
            tile2.sprite,
            {
              x: tile2X,
              y: tile2Y,
              duration: config.swapSpeed,
              ease: "power2.out",
            },
            "<"
          )
          .call(() => {
            //если нет матча - меняем элементы назад

            [
              gameState.board[tile1.row][tile1.col],
              gameState.board[tile2.row][tile2.col],
            ] = [
              gameState.board[tile2.row][tile2.col],
              gameState.board[tile1.row][tile1.col],
            ];

            [tile1.row, tile2.row] = [tile2.row, tile1.row];
            [tile1.col, tile2.col] = [tile2.col, tile1.col];

            gameState.isAnimating = false;
            gameState.dragData = null;
            tile1.zIndex = 0;
          });
      }
    },
  });

  swapTl
    .to(tile1.sprite, {
      x: tile2X,
      y: tile2Y,
      duration: config.swapSpeed,
      ease: "power2.out",
    })
    .to(
      tile2.sprite,
      {
        x: tile1X,
        y: tile1Y,
        duration: config.swapSpeed,
        ease: "power2.out",
      },
      "<"
    ); // Запускаем одновременно
}

// обрабатываем матч 3 в ряд
function processMatches(matches) {
  // Remove matched tiles
  const matchedTiles = new Set();
  for (const match of matches) {
    match.forEach((tile) => matchedTiles.add(tile));
  }
  
  let matchedTilesCount = 0;

  // Анимация "взрыва" элемента после матча
  matchedTiles.forEach((tile) => {
    matchedTilesCount += 1;
    const explosion = new Graphics();
    explosion.beginFill(0xffffff);
    explosion.drawCircle(0, 0, config.tileSize / 2);
    explosion.endFill();
    explosion.x = tile.sprite.x + config.tileSize / 2;
    explosion.y = tile.sprite.y + config.tileSize / 2;
    gameState.tileContainer.addChild(explosion);

    gsap.to(explosion, {
      alpha: 0,
      width: 0,
      height: 0,
      duration: 0.3, 
      onComplete: () => {
        gameState.tileContainer.removeChild(explosion);
        gameState.dragData = null;
      },
    });
    gameState.tileContainer.removeChild(tile.sprite);
    gameState.board[tile.row][tile.col] = null;
  });

  // После анимации запускаем выпадение новых элементов сверху
  setTimeout(() => {
    makeTilesFall();
  }, 300);

  //добавляем очки
  gameState.matchesCount += matches.length;
  gameState.score += matchedTilesCount * 10;
  setScore();

  // Проверяем, нужно ли показать попап
  if (gameState.matchesCount >= config.matchesBeforeInstallPrompt) {
    gameState.matchesCount = 0;
    showInstallPopup();
  }
}

// Новые элементы падают сверху
function makeTilesFall() {
  let moved = false;

  for (let col = 0; col < config.columns; col++) {
    let emptySpaces = 0;

    for (let row = config.rows - 1; row >= 0; row--) {
      if (!gameState.board[row][col]) {
        emptySpaces++;
      } else if (emptySpaces > 0) {
        
        const tile = gameState.board[row][col];
        gameState.board[row + emptySpaces][col] = tile;
        gameState.board[row][col] = null;
        tile.row = row + emptySpaces;

        // Анимация падения
        gsap.to(tile.sprite, {
          y: tile.row * (config.tileSize + config.tileSpacing),
          duration: config.fallSpeed * emptySpaces,
        });
        moved = true;
      }
    }

    // Добавляем новые элементы наверх
    for (let row = 0; row < emptySpaces; row++) {
      const tileType = Math.floor(Math.random() * config.tileTypes);
      const tile = createTile(row, col, tileType);
      gameState.board[row][col] = tile;
      gameState.tileContainer.addChild(tile.sprite);

      tile.sprite.y =
        -config.tileSize -
        (emptySpaces - row) * (config.tileSize + config.tileSpacing);
      gsap.to(tile.sprite, {
        y: row * (config.tileSize + config.tileSpacing),
        duration: config.fallSpeed * (emptySpaces - row + 1),
        ease: "power1.out", // Добавляем плавное ускорение/замедление
      });

      moved = true;
    }
  }

  // Проверяем есть ли 3(и более) в ряд после выпадения новых элементов
  if (moved) {
    setTimeout(
      () => {
        const newMatches = findMatches();
        if (newMatches.length > 0) {
          processMatches(newMatches);
        } else {
          gameState.isAnimating = false;
          if (!findPossibleMove()) {
            reshuffleBoard();
          }
        }
      },
      config.fallSpeed * config.rows + 100
    );
  } else {
    gameState.isAnimating = false;
    if (!findPossibleMove()) {
      reshuffleBoard();
    }
  }
}

function setupDragHandlers(tile) {
  //событие обработки перетаскивания на каждый элемент поля
  tile.sprite.interactive = true;
  tile.sprite.cursor = "pointer";

  tile.sprite.on("pointerdown", (e) => onDragStart(e, tile));
  tile.sprite.on("pointerup", () => onDragEnd(tile));
  tile.sprite.on("pointerupoutside", () => onDragEnd(tile));
  tile.sprite.on("pointermove", (e) => onDragMove(e, tile));
}

function onDragStart(event, tile) {
  if (gameState.isPaused) return;

  if (gameState.isAnimating) return;
  resetHintTimer();

  const { data } = event;
  gameState.dragData = {
    target: tile,
    startX: data.global.x,
    startY: data.global.y,
    originalX: tile.sprite.x,
    originalY: tile.sprite.y,
    dragging: false,
  };
}

function onDragMove(event, tile) {
  if (!gameState.dragData || gameState.dragData.target !== tile) return;

  const { data } = event;
  const dx = data.global.x - gameState.dragData.startX;
  const dy = data.global.y - gameState.dragData.startY;

  // Проверяем порог для начала перетаскивания
  if (
    !gameState.dragData.dragging &&
    Math.abs(dx) < config.dragThreshold &&
    Math.abs(dy) < config.dragThreshold
  ) {
    return;
  }

  gameState.dragData.dragging = true;

  // Обновляем позицию спрайта
  tile.sprite.x = gameState.dragData.originalX + dx;
  tile.sprite.y = gameState.dragData.originalY + dy;
  tile.sprite.zIndex = 1; // Поднимаем над другими плитками
}

function onDragEnd(tile) {
  if (
    !gameState.dragData ||
    gameState.dragData.target !== tile ||
    !gameState.dragData.dragging
  ) {
    return;
  }

  const dx = tile.sprite.x - gameState.dragData.originalX;
  const dy = tile.sprite.y - gameState.dragData.originalY;

  // Возвращаем плитку на место или свапаем
  if (Math.abs(dx) > 2 * Math.abs(dy)) {
    // Горизонтальное движение, если смещение по X в 2 раза больше чем по Y
    const direction = dx > 0 ? 1 : -1;
    const targetCol = tile.col + direction;

    if (targetCol >= 0 && targetCol < config.columns) {
      const neighbor = gameState.board[tile.row][targetCol];

      if (neighbor) {
        tile.sprite.zIndex = 0;
        gameState.dragData = null;
        swapTiles(tile, neighbor);
        return;
      }
    }
  } else if (Math.abs(dy) > 2 * Math.abs(dx)) {
    // Вертикальное движение, если DY больше в 2 раза чем DX
    const direction = dy > 0 ? 1 : -1;
    const targetRow = tile.row + direction;

    if (targetRow >= 0 && targetRow < config.rows) {
      const neighbor = gameState.board[targetRow][tile.col];

      if (neighbor) {
        tile.sprite.zIndex = 0;
        gameState.dragData = null;
        swapTiles(tile, neighbor);
        return;
      }
    }
  }

  // Если свап не произошел, возвращаем плитку на место
  gsap.to(tile.sprite, {
    x: gameState.dragData.originalX,
    y: gameState.dragData.originalY,
    duration: config.swapSpeed * 0.5,
    onComplete: () => {},
  });

  tile.sprite.zIndex = 0;
  gameState.dragData = null;
}
