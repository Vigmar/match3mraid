import { gameState } from "./game-state.js";
import { config } from "./config.js";
import { initBoard } from "./board.js";
import { gsap } from "gsap";

// Функция для поиска возможного хода
export function findPossibleMove() {
  for (let row = 0; row < config.rows; row++) {
    for (let col = 0; col < config.columns; col++) {
      const tile = gameState.board[row][col];
      if (!tile) continue;

      // Проверяем соседние плитки
      const directions = [
        { dr: 0, dc: 1 }, // вправо
        { dr: 1, dc: 0 }, // вниз
      ];

      for (const dir of directions) {
        const newRow = row + dir.dr;
        const newCol = col + dir.dc;

        if (newRow >= config.rows || newCol >= config.columns) continue;

        const neighbor = gameState.board[newRow][newCol];
        if (!neighbor) continue;

        // Пробуем свапнуть временно
        [tile.type, neighbor.type] = [neighbor.type, tile.type];

        // Проверяем, создает ли это совпадение
        const matches = findMatches();

        // Возвращаем обратно
        [tile.type, neighbor.type] = [neighbor.type, tile.type];

        if (matches.length > 0) {
          return { tile1: tile, tile2: neighbor };
        }
      }
    }
  }
  return null;
}

export function reshuffleBoard() {
  if (gameState.isAnimating || gameState.isReshuffling) return;

  gameState.isReshuffling = true;

  // Анимация исчезновения плиток
  const allTiles = [];
  for (let row = 0; row < config.rows; row++) {
    for (let col = 0; col < config.columns; col++) {
      if (gameState.board[row][col]) {
        allTiles.push(gameState.board[row][col]);
      }
    }
  }

  const animation = gsap.to(
    allTiles.map((t) => t.sprite),
    {
      alpha: 0,
      duration: config.reshuffleDelay,
      onComplete: () => {
        // Удаляем все плитки
        allTiles.forEach((tile) => {
          gameState.tileContainer.removeChild(tile.sprite);
        });

        // Создаем новое поле
        initBoard();

        gameState.isReshuffling = false;

        // Если после перестройки все равно нет ходов - перестраиваем снова
        setTimeout(() => {
          if (!findPossibleMove()) {
            reshuffleBoard();
          }
        }, 1000);
      },
    }
  );
}

// Находим все матчи 3 в ряд на доске
export function findMatches() {
  const matches = [];

  // Проверка горизонтальных
  for (let row = 0; row < config.rows; row++) {
    for (let col = 0; col < config.columns - 2; col++) {
      const tile = gameState.board[row][col];
      if (
        tile &&
        tile.type === gameState.board[row][col + 1].type &&
        tile.type === gameState.board[row][col + 2].type
      ) {
        // ищем макс. длину линии матча
        let matchLength = 3;
        while (
          col + matchLength < config.columns &&
          gameState.board[row][col + matchLength].type === tile.type
        ) {
          matchLength++;
        }

        // Добавляем к списку матчей
        const match = [];
        for (let i = 0; i < matchLength; i++) {
          match.push(gameState.board[row][col + i]);
        }
        matches.push(match);

        col += matchLength - 1;
      }
    }
  }

  // Проверка вертикальных, логика та же
  for (let col = 0; col < config.columns; col++) {
    for (let row = 0; row < config.rows - 2; row++) {
      const tile = gameState.board[row][col];
      if (
        tile &&
        tile.type === gameState.board[row + 1][col].type &&
        tile.type === gameState.board[row + 2][col].type
      ) {
        let matchLength = 3;
        while (
          row + matchLength < config.rows &&
          gameState.board[row + matchLength][col].type === tile.type
        ) {
          matchLength++;
        }

        const match = [];
        for (let i = 0; i < matchLength; i++) {
          match.push(gameState.board[row + i][col]);
        }
        matches.push(match);

        row += matchLength - 1;
      }
    }
  }

  return matches;
}
