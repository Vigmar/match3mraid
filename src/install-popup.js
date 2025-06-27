import { config } from "./config.js";
import { gameState } from "./game-state.js";
import { Graphics, Text, Container } from "pixi.js";
import { mraidState } from "./mraid-manager.js";

// Создаем функцию для показа попапа
export function createInstallPopup() {
  // Создаем контейнер для попапа
  const popupContainer = new Container();
  popupContainer.width = config.width * 0.8;
  popupContainer.height = 200;
  popupContainer.x = (config.width - config.width * 0.8) / 2;
  popupContainer.y = (config.height - 200) / 2;

  // Фон попапа
  const bg = new Graphics();
  bg.beginFill(0x000000, 0.8);
  bg.drawRoundedRect(0, 0, config.width * 0.8, 200, 15);
  bg.endFill();
  popupContainer.addChild(bg);

  // Текст попапа
  const text = new Text("Установите игру!", {
    fontFamily: "Arial",
    fontSize: 20,
    fill: 0xffffff,
    align: "center",
    wordWrap: true,
    wordWrapWidth: popupContainer.width - 40,
  });
  text.anchor.set(0.5);
  text.x = popupContainer.width / 2;
  text.y = popupContainer.height / 3;
  popupContainer.addChild(text);

  // Кнопка установки
  const button = new Graphics();
  button.beginFill(0x4caf50);
  button.drawRoundedRect(popupContainer.width / 2 - 100, 100, 200, 60, 10);
  button.endFill();
  button.interactive = true;
  button.buttonMode = true;

  const buttonText = new Text("Установить", {
    fontFamily: "Arial",
    fontSize: 24,
    fill: 0xffffff,
  });
  buttonText.anchor.set(0.5);
  buttonText.x = popupContainer.width / 2;
  buttonText.y = popupContainer.height / 2 + 30;
  popupContainer.addChild(button, buttonText);

  // Обработчик клика по кнопке
  button.on("pointerdown", () => {
    // Логика установки приложения,через MRAID если доступен, или через простое открытие нового окна

    if (typeof mraid !== "undefined" && mraidState.isReady) {
      mraid.open("https://play.google.com/store/apps/details?id=com.your.game");
    } else {
      window.open(
        "https://play.google.com/store/apps/details?id=com.your.game",
        "_blank"
      );
    }
    hideInstallPopup();
  });

  // Кнопка закрытия
  const closeButton = new Graphics();
  closeButton.beginFill(0xf44336);
  closeButton.drawCircle(popupContainer.width - 30, 30, 20);
  closeButton.endFill();
  closeButton.interactive = true;
  closeButton.buttonMode = true;

  const closeText = new Text("X", {
    fontFamily: "Arial",
    fontSize: 24,
    fill: 0xffffff,
  });
  closeText.anchor.set(0.5);
  closeText.x = popupContainer.width - 30;
  closeText.y = 30;
  popupContainer.addChild(closeButton, closeText);

  closeButton.on("pointerdown", hideInstallPopup);

  gameState.installPopup = popupContainer;
  popupContainer.visible = false;
  gameState.uiContainer.addChild(popupContainer);
}

export function showInstallPopup() {
  if (!gameState.installPopup) {
    createInstallPopup();
  }

  gameState.isPaused = true;
  gameState.installPopup.visible = true;
  gameState.installPopup.zIndex = 1000;
}

function hideInstallPopup() {
  if (gameState.installPopup) {
    gameState.installPopup.visible = false;
    gameState.isPaused = false;
  }
}
