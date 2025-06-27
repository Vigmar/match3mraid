import { Application, Assets, Container, Spritesheet } from "pixi.js";

import { initMRAID } from "./mraid-manager";
import { gameState } from "./game-state";
import { config } from "./config";
import { createInstallPopup } from "./install-popup";
import { findPossibleMove, reshuffleBoard } from "./logic.js";
import { initBoard } from "./board.js";
import { createScoreText} from "./score-ui.js";

async function createTileTextures() {
  gameState.tileTextures = [];

  const { frameWidth, frameHeight } = config;

  await Assets.load({
    alias: "gems",
    src: "assets/gems.png",
    data: {
      frameWidth: config.frameWidth,
      frameHeight: config.frameHeight,
    },
  });

  const textureGems = Assets.get("gems");

  const sheetData = {
    frames: {},
    meta: {
      scale: "1",
      format: "RGBA8888",
      size: { w: 600, h: 100 }, // Общие размеры атласа
    },
  };

  for (let i = 0; i < config.tileTypes; i++) {
    sheetData.frames[`tile_${i}`] = {
      frame: {
        x: i * 100,
        y: 0,
        w: 100,
        h: 100,
      },
    };
  }

  const sheet = new Spritesheet(Assets.get("gems"), sheetData);
  await sheet.parse();

  for (let i = 0; i < config.tileTypes; i++) {
    gameState.tileTextures.push(sheet.textures[`tile_${i}`]);
  }
}

(async () => {
  function handleResize() {
    // Получаем новые размеры (можно использовать window.innerWidth/Height или другой элемент)
    const newWidth = window.innerWidth;
    const newHeight = window.innerHeight;
    const newScale = Math.min(
      newWidth / config.width,
      newHeight / config.height
    );
    let posX =
      (newScale *
        (config.width -
          config.columns * (config.tileSize + config.tileSpacing))) /
      2;
    let posY =
      (newScale *
        (config.height -
          config.rows * (config.tileSize + config.tileSpacing))) /
      2;
    let shiftX = 0;
    let shiftY = 0;

    if (newWidth > newHeight) shiftX = (newWidth - newHeight) / 2;
    if (newWidth < newHeight) shiftY = (newHeight - newWidth) / 2;

    // Изменяем размер рендерера
    app.renderer.resize(newWidth, newHeight);

    // Масштабируем или перестраиваем сцену по необходимости
    if (gameState.tileContainer) {
      gameState.tileContainer.scale.set(newScale);
      gameState.tileContainer.x = posX + shiftX;
      gameState.tileContainer.y = posY + shiftY;
    }

    if (gameState.uiContainer) {
      gameState.uiContainer.scale.set(newScale);
      gameState.uiContainer.x  =shiftX;
      gameState.uiContainer.y  =shiftY;
      
    }
  }

  initMRAID();

  const app = new Application();
  gameState.app = app;

  await app.init({ background: "#1099bb", resizeTo: window });

  document.getElementById("pixi-container").appendChild(app.canvas);

  window.addEventListener("resize", handleResize);

  gameState.tileContainer = new Container();
  app.stage.addChild(gameState.tileContainer);

  gameState.uiContainer = new Container();
  app.stage.addChild(gameState.uiContainer);
  createScoreText();

  await createTileTextures();
  initBoard();
  if (!findPossibleMove()) {
    reshuffleBoard();
  }

  createInstallPopup();

  handleResize();
})();
