type EventHandler<T = any> = (payload: T) => Promise<void>;

class EventBus {
  private handlers: Record<string, EventHandler[]> = {};

  on<T>(event: string, handler: EventHandler<T>) {
    this.handlers[event] ??= [];
    this.handlers[event].push(handler);
  }

  async emit<T>(event: string, payload: T) {
    const handlers = this.handlers[event] || [];
    for (const handler of handlers) {
      await handler(payload);
    }
  }
}

export const eventBus = new EventBus();
