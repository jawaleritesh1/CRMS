import { AsyncLocalStorage } from 'async_hooks';

export interface RequestContext {
  correlationId: string;
  requestId: string;
  organizationId?: string;
  userId?: string;
  membershipId?: string;
  sessionId?: string;
  actorType?: 'USER' | 'SYSTEM' | 'AUTOMATION';
}

const asyncLocalStorage = new AsyncLocalStorage<RequestContext>();

export const asyncContext = {
  run<R>(context: RequestContext, fn: () => R): R {
    return asyncLocalStorage.run(context, fn);
  },

  get(): RequestContext | undefined {
    return asyncLocalStorage.getStore();
  },

  getCorrelationId(): string {
    const store = asyncLocalStorage.getStore();
    return store?.correlationId || 'no-correlation-id';
  },

  getOrganizationId(): string | undefined {
    return asyncLocalStorage.getStore()?.organizationId;
  },

  set(partialContext: Partial<RequestContext>): void {
    const store = asyncLocalStorage.getStore();
    if (store) {
      Object.assign(store, partialContext);
    }
  },
};
