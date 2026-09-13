import { Game } from './game/Game';

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  if (!canvas) {
    console.error('Failed to locate #game-canvas element');
    return;
  }

  const game = new Game(canvas);

  // Expose game instance for inspection / debugging if needed
  (window as unknown as { __game?: Game }).__game = game;
});

// Force clean reload on code change in dev
if ((import.meta as unknown as { hot?: { accept: (cb: () => void) => void } }).hot) {
  (import.meta as unknown as { hot: { accept: (cb: () => void) => void } }).hot.accept(() => {
    window.location.reload();
  });
}
