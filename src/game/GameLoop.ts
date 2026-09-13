export type UpdateCallback = (delta: number, time: number) => void;

export class GameLoop {
  private isRunning = false;
  private lastTime = 0;
  private animationFrameId: number | null = null;
  private callback: UpdateCallback;

  constructor(callback: UpdateCallback) {
    this.callback = callback;
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.loop();
  }

  public stop(): void {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private loop = (): void => {
    if (!this.isRunning) return;

    const now = performance.now();
    const rawDelta = (now - this.lastTime) / 1000;
    this.lastTime = now;

    // Clamp delta to prevent simulation spikes during tab changes or hiccups
    const delta = Math.min(rawDelta, 0.1);
    const time = now / 1000;

    this.callback(delta, time);

    this.animationFrameId = requestAnimationFrame(this.loop);
  };
}
