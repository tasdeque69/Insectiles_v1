import { describe, it, expect, beforeEach } from 'vitest';
import { ObjectPool, Poolable } from '../engine/ObjectPool';

class TestItem implements Poolable {
  active = false;
  value = 0;

  reset(): void {
    this.value = 0;
  }
}

describe('ObjectPool', () => {
  let pool: ObjectPool<TestItem>;

  beforeEach(() => {
    pool = new ObjectPool<TestItem>(
      () => new TestItem(),
      5,
      100,
      (item) => item.reset()
    );
  });

  describe('acquire/release', () => {
    it('should acquire items from pool', () => {
      const item = pool.acquire();
      expect(item).toBeDefined();
      expect(item.active).toBe(true);
      expect(pool.getInUseCount()).toBe(1);
    });

    it('should release items back to pool', () => {
      const initialAvailable = pool.getAvailableCount();
      const item = pool.acquire();
      item.value = 42;
      pool.release(item);
      expect(pool.getInUseCount()).toBe(0);
      expect(pool.getAvailableCount()).toBe(initialAvailable);
    });

    it('should reuse released items', () => {
      const item1 = pool.acquire();
      item1.value = 1;
      pool.release(item1);

      const item2 = pool.acquire();
      expect(item2).toBe(item1);
      expect(item2.value).toBe(0);
    });
  });

  describe('preallocation', () => {
    it('should preallocate items on creation', () => {
      expect(pool.getAvailableCount()).toBe(5);
      expect(pool.getTotalCount()).toBe(5);
    });

    it('should grow pool when exhausted', () => {
      const largePool = new ObjectPool<TestItem>(() => new TestItem(), 2, 10);
      largePool.acquire();
      largePool.acquire();

      const item3 = largePool.acquire();
      expect(item3).toBeDefined();
      expect(largePool.getTotalCount()).toBe(3);
    });

    it('should throw when exceeding max size', () => {
      const smallPool = new ObjectPool<TestItem>(() => new TestItem(), 1, 2);
      smallPool.acquire();
      smallPool.acquire();

      expect(() => smallPool.acquire()).toThrow();
    });
  });

  describe('releaseAll', () => {
    it('should release all items', () => {
      pool.acquire();
      pool.acquire();
      pool.acquire();

      pool.releaseAll();

      expect(pool.getInUseCount()).toBe(0);
      expect(pool.getAvailableCount()).toBe(5);
    });
  });

  describe('statistics', () => {
    it('should track available count', () => {
      expect(pool.getAvailableCount()).toBe(5);
      pool.acquire();
      expect(pool.getAvailableCount()).toBe(4);
    });

    it('should track in-use count', () => {
      expect(pool.getInUseCount()).toBe(0);
      pool.acquire();
      expect(pool.getInUseCount()).toBe(1);
    });

    it('should report max capacity', () => {
      expect(pool.isAtMaxCapacity()).toBe(false);
      const items = [];
      for (let i = 0; i < 100; i++) {
        items.push(pool.acquire());
      }
      expect(pool.isAtMaxCapacity()).toBe(true);
    });
  });

  describe('clear', () => {
    it('should clear all items', () => {
      pool.acquire();
      pool.acquire();
      pool.clear();

      expect(pool.getTotalCount()).toBe(0);
      expect(pool.getAvailableCount()).toBe(0);
      expect(pool.getInUseCount()).toBe(0);
    });
  });
});
