import { Injectable, signal } from '@angular/core';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface AppNotification {
  id: number;
  type: NotificationType;
  title?: string;
  message: string;
  timestamp: Date;
  autoDismissMs?: number;
}

/**
 * NotificationService — Reactive notification/toast manager using Angular Signals.
 * Exposes a reactive notifications signal for UI rendering and provides auto-dismissal.
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private nextId = 1;
  private readonly DEFAULT_AUTO_DISMISS_MS = 5000;

  /** Reactive list of active notifications. */
  readonly notifications = signal<AppNotification[]>([]);

  show(
    type: NotificationType,
    message: string,
    title?: string,
    autoDismissMs: number = this.DEFAULT_AUTO_DISMISS_MS
  ): number {
    const id = this.nextId++;
    const notification: AppNotification = {
      id,
      type,
      title,
      message,
      timestamp: new Date(),
      autoDismissMs,
    };

    this.notifications.update((list) => [...list, notification]);

    if (autoDismissMs > 0) {
      setTimeout(() => this.dismiss(id), autoDismissMs);
    }

    return id;
  }

  success(message: string, title: string = 'Success'): number {
    return this.show('success', message, title);
  }

  error(message: string, title: string = 'Error'): number {
    return this.show('error', message, title, 7000);
  }

  warning(message: string, title: string = 'Warning'): number {
    return this.show('warning', message, title);
  }

  info(message: string, title: string = 'Info'): number {
    return this.show('info', message, title);
  }

  dismiss(id: number): void {
    this.notifications.update((list) => list.filter((n) => n.id !== id));
  }

  clear(): void {
    this.notifications.set([]);
  }
}
