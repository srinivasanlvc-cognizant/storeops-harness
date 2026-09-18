import { EventEmitter } from 'node:events';
import type { DomainEventMap, DomainEventName } from './types';

class EventBus {
  private readonly emitter = new EventEmitter();

  publish<K extends DomainEventName>(event: K, payload: DomainEventMap[K]): void {
    this.emitter.emit(event, payload);
  }

  subscribe<K extends DomainEventName>(event: K, handler: (payload: DomainEventMap[K]) => void): void {
    this.emitter.on(event, handler);
  }

  removeAllListeners(): void {
    this.emitter.removeAllListeners();
  }
}

export const eventBus = new EventBus();
