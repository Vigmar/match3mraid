import { gameState } from "./game-state.js";

export const mraidState = {
  isReady: false,
  isViewable: false,
  adContainer: document.getElementById("ad-container"),
};

export function initMRAID() {
  if (typeof mraid !== "undefined") {
    // MRAID доступен
    mraid.addEventListener("ready", onMRAIDReady);
    mraid.addEventListener("viewableChange", onViewableChange);
    mraid.addEventListener("error", onMRAIDError);
  } else {
    console.log("MRAID not available - running in standalone mode");
    // Эмуляция MRAID для тестирования
    window.mraid = {
      getState: () => "ready",
      addEventListener: (event, callback) => {
        if (event === "ready") setTimeout(callback, 100);
      },
      expand: (url) => window.open(url, "_blank"),
      close: () => console.log("MRAID close"),
      // ... другие методы по необходимости
    };
    setTimeout(onMRAIDReady, 100);
  }
}

function onMRAIDReady() {
  console.log("READY");
  mraidState.isReady = true;
  mraidState.isViewable = mraid.isViewable();
  console.log("MRAID ready, viewable:", mraidState.isViewable);

  // Проверяем размеры и положение
  if (mraid.getState() === "default") {
    mraid.useCustomClose(true);
  }
}

function onViewableChange(viewable) {
  mraidState.isViewable = viewable;
  console.log("Viewable changed:", viewable);

  if (!viewable) {
    // Пауза игры когда реклама не видима
    gameState.isPaused = true;
  } else {
    // Возобновление игры
    gameState.isPaused = false;
  }
}

function onMRAIDError(message) {
  console.error("MRAID error:", message);
}

function showRewardedAd() {
  return new Promise((resolve, reject) => {
    if (!mraidState.isReady) {
      resolve(false);
      return;
    }

    gameState.isPaused = true;
    mraidState.adContainer.style.display = "block";

    // Эмуляция рекламы (в реальном приложении будет MRAID вызов)
    const closeAd = () => {
      mraidState.adContainer.style.display = "none";
      gameState.isPaused = false;
      resolve(true);
    };

    // Кнопка закрытия (в реальном приложении будет через MRAID)
    const closeButton = document.createElement("div");
    closeButton.textContent = "X";
    closeButton.style.position = "absolute";
    closeButton.style.right = "10px";
    closeButton.style.top = "10px";
    closeButton.style.zIndex = "1000";
    closeButton.onclick = closeAd;

    mraidState.adContainer.innerHTML = "";
    mraidState.adContainer.appendChild(closeButton);

    // В реальном приложении:
    // mraid.expand('https://ad.server.com/rewarded');
    // и обработка событий MRAID
  });
}
