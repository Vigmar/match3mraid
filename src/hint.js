import { Assets, Sprite } from 'pixi.js';
import { gsap } from "gsap";

import { gameState } from './game-state.js';
import { config } from './config.js';
import { findPossibleMove} from "./logic.js";

export function resetHintTimer() {
    if (gameState.hintTimeout) {
      clearTimeout(gameState.hintTimeout);
    }
    if (gameState.hintAnimation) {
      gameState.hintAnimation.kill();
    }
    if (gameState.handSprite) {
      gameState.tileContainer.removeChild(gameState.handSprite);
      gameState.handSprite = null;
    }

    gameState.lastMoveTime = Date.now();
    gameState.hintTimeout = setTimeout(showHint, config.hintDelay * 1000);
  }
  
  export async function showHint() {
    if (gameState.isPaused) return;

    if (gameState.isAnimating) {
      resetHintTimer();
      return;
    }

    const move = findPossibleMove();
    if (!move) {
      resetHintTimer();
      return;
    }

    // Загружаем спрайт руки (если еще не загружен)
    if (!gameState.handTexture) {
      gameState.handTexture = await Assets.load("assets/hand.png");
    }

    // Создаем спрайт руки
    const hand = new Sprite(gameState.handTexture);
    hand.anchor.set(0.5, 0.9);
    hand.scale.set(0.5);
    hand.alpha = 0;
    gameState.handSprite = hand;
    gameState.tileContainer.addChild(hand);

    // Позиционируем руку между плитками
    const tile1 = move.tile1;
    const tile2 = move.tile2;
    const x = tile1.sprite.x + config.tileSize / 2;
    const y = tile1.sprite.y + config.tileSize / 2;
    hand.position.set(x, y);

    // Анимация подсказки
    gameState.hintAnimation = gsap
      .timeline({ repeat: -1, repeatDelay: config.hintPause })
      .to(hand, {
        alpha: 1,
        duration: 0.3,
      })
      .to(hand, {
        x: tile2.sprite.x + config.tileSize / 2,
        y: tile2.sprite.y + config.tileSize / 2,
        duration: config.hintDuration * 0.5,
        ease: "power1.inOut",
      })
      .to(hand, {
        x: x,
        y: y,
        duration: config.hintDuration * 0.5,
        ease: "power1.inOut",
      })
      .to(
        hand,
        {
          alpha: 0,
          duration: 0.3,
        },
        `+=${config.hintPause}`
      );
  }