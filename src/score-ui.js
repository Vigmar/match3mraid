import { gsap } from "gsap";

import { config } from "./config.js";
import { gameState } from "./game-state.js";
import {  Text} from "pixi.js";


// Создаем функцию для показа попапа
export function createScoreText() {
  gameState.scoreText = new Text(gameState.score, {
    fontFamily: "Arial",
    fontSize: 40,
    fill: 0xffffff,
  });

  gameState.scoreText.anchor.set(0.5,0);

  // Позиционируем по центру экрана по X и сверху по Y
  gameState.scoreText.x = config.width / 2;
  gameState.scoreText.y = 20;

  gameState.uiContainer.addChild(gameState.scoreText);
}

export function setScore() {
  
  gameState.scoreText.text = gameState.score;
  gsap.fromTo(
        gameState.scoreText.scale,
        { x: 1, y: 1 },
        {
            x: 1.2,
            y: 1.2,
            duration: 0.2,
            ease: "power1.out",
            onComplete: () => {
                gsap.to(gameState.scoreText.scale, {
                    x: 1,
                    y: 1,
                    duration: 0.2,
                    ease: "power1.in"
                });
            }
        }
    );
}
