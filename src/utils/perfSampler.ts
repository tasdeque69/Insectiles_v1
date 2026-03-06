export interface PerfSnapshot {
  fps: number;
  avgFrameMs: number;
  droppedFrames: number;
  samples: number;
}

const TARGET_FRAME_MS = 1000 / 60;

export class PerfSampler {
  private readonly alpha: number;
  private lastTimestamp: number | null = null;
  private emaFrameMs = TARGET_FRAME_MS;
  private droppedFrames = 0;
  private samples = 0;

  constructor(alpha = 0.15) {
    this.alpha = alpha;
  }

  reset(): void {
    this.lastTimestamp = null;
    this.emaFrameMs = TARGET_FRAME_MS;
    this.droppedFrames = 0;
    this.samples = 0;
  }

  sample(timestamp: number): PerfSnapshot {
    if (this.lastTimestamp === null) {
      this.lastTimestamp = timestamp;
      return this.getSnapshot();
    }

    const rawFrameMs = Math.max(1, timestamp - this.lastTimestamp);
    this.lastTimestamp = timestamp;
    this.emaFrameMs = this.alpha * rawFrameMs + (1 - this.alpha) * this.emaFrameMs;

    if (rawFrameMs > TARGET_FRAME_MS * 1.2) {
      this.droppedFrames += 1;
    }
    this.samples += 1;

    return this.getSnapshot();
  }

  getSnapshot(): PerfSnapshot {
    const avgFrameMs = Number(this.emaFrameMs.toFixed(2));
    const fps = Number((1000 / Math.max(this.emaFrameMs, 1)).toFixed(1));
    return {
      fps,
      avgFrameMs,
      droppedFrames: this.droppedFrames,
      samples: this.samples,
    };
  }
}

