export interface Poolable {
  active: boolean;
  reset?: () => void;
}

export class ObjectPool<T extends Poolable> {
  private available: T[] = [];
  private inUse: Set<T> = new Set();
  private factory: () => T;
  private resetFn?: (item: T) => void;
  private initialSize: number;
  private maxSize: number;

  constructor(
    factory: () => T,
    initialSize: number = 10,
    maxSize: number = 1000,
    resetFn?: (item: T) => void
  ) {
    this.factory = factory;
    this.initialSize = initialSize;
    this.maxSize = maxSize;
    this.resetFn = resetFn;
    this.preallocate(initialSize);
  }

  private preallocate(count: number): void {
    for (let i = 0; i < count; i++) {
      const item = this.factory();
      item.active = false;
      this.available.push(item);
    }
  }

  public acquire(): T {
    let item: T;

    if (this.available.length > 0) {
      item = this.available.pop()!;
    } else if (this.inUse.size < this.maxSize) {
      item = this.factory();
    } else {
      throw new Error(`ObjectPool: Max pool size ${this.maxSize} exceeded`);
    }

    item.active = true;
    this.inUse.add(item);
    return item;
  }

  public release(item: T): void {
    if (!this.inUse.has(item)) {
      console.warn('ObjectPool: Trying to release item that is not in use');
      return;
    }

    if (this.resetFn) {
      this.resetFn(item);
    } else if (item.reset) {
      item.reset();
    }

    item.active = false;
    this.inUse.delete(item);
    this.available.push(item);
  }

  public releaseAll(): void {
    this.inUse.forEach((item) => {
      if (this.resetFn) {
        this.resetFn(item);
      } else if (item.reset) {
        item.reset();
      }
      item.active = false;
      this.available.push(item);
    });
    this.inUse.clear();
  }

  public getAvailableCount(): number {
    return this.available.length;
  }

  public getInUseCount(): number {
    return this.inUse.size;
  }

  public getTotalCount(): number {
    return this.available.length + this.inUse.size;
  }

  public isAtMaxCapacity(): boolean {
    return this.inUse.size >= this.maxSize;
  }

  public clear(): void {
    this.inUse.clear();
    this.available = [];
  }
}

export default ObjectPool;
