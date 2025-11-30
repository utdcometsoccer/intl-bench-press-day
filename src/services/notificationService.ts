// Push Notification Service for Workout Reminders
// Uses the Web Notifications API and Service Worker for push notifications

// Time constants
const ONE_HOUR_MS = 60 * 60 * 1000;
const NOTIFICATION_GRACE_PERIOD_MS = ONE_HOUR_MS; // Show notification if within the last hour

export interface NotificationPermissionStatus {
  granted: boolean;
  denied: boolean;
  default: boolean;
}

export interface ScheduledNotification {
  id: string;
  title: string;
  body: string;
  scheduledTime: Date;
  workoutId?: string;
}

class NotificationService {
  private scheduledNotifications: Map<string, number> = new Map();

  // Check if notifications are supported
  isSupported(): boolean {
    return 'Notification' in window;
  }

  // Get current permission status
  getPermissionStatus(): NotificationPermissionStatus {
    if (!this.isSupported()) {
      return { granted: false, denied: true, default: false };
    }

    return {
      granted: Notification.permission === 'granted',
      denied: Notification.permission === 'denied',
      default: Notification.permission === 'default',
    };
  }

  // Request notification permission
  async requestPermission(): Promise<boolean> {
    if (!this.isSupported()) {
      console.warn('Notifications are not supported in this browser');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  // Show an immediate notification
  async showNotification(
    title: string,
    options?: NotificationOptions
  ): Promise<boolean> {
    const status = this.getPermissionStatus();
    
    if (!status.granted) {
      console.warn('Notification permission not granted');
      return false;
    }

    try {
      // Try to use service worker notification first (works when app is closed)
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(title, {
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-72x72.png',
          ...options,
        });
        return true;
      }
      
      // Fallback to regular notification
      new Notification(title, {
        icon: '/icons/icon-192x192.png',
        ...options,
      });
      return true;
    } catch (error) {
      console.error('Error showing notification:', error);
      return false;
    }
  }

  // Show a workout reminder notification
  async showWorkoutReminder(
    exerciseName: string,
    week: number,
    day: number
  ): Promise<boolean> {
    const title = 'Time to Train! 💪';
    const body = `Your ${exerciseName} workout (Week ${week}, Day ${day}) is scheduled for today. Let's get those gains!`;
    
    return this.showNotification(title, {
      body,
      tag: 'workout-reminder',
      requireInteraction: true,
    });
  }

  // Schedule a notification for a specific time
  scheduleNotification(notification: ScheduledNotification): string {
    const now = Date.now();
    const scheduledTime = notification.scheduledTime.getTime();
    const delay = scheduledTime - now;

    if (delay <= 0) {
      // Notification time has passed, show immediately if within grace period
      if (delay > -NOTIFICATION_GRACE_PERIOD_MS) {
        this.showNotification(notification.title, { body: notification.body });
      }
      return notification.id;
    }

    // Schedule the notification using setTimeout
    const timeoutId = window.setTimeout(() => {
      this.showNotification(notification.title, { body: notification.body });
      this.scheduledNotifications.delete(notification.id);
    }, delay);

    this.scheduledNotifications.set(notification.id, timeoutId);
    return notification.id;
  }

  // Cancel a scheduled notification
  cancelScheduledNotification(id: string): boolean {
    const timeoutId = this.scheduledNotifications.get(id);
    if (timeoutId) {
      window.clearTimeout(timeoutId);
      this.scheduledNotifications.delete(id);
      return true;
    }
    return false;
  }

  // Cancel all scheduled notifications
  cancelAllScheduledNotifications(): void {
    this.scheduledNotifications.forEach((timeoutId) => {
      window.clearTimeout(timeoutId);
    });
    this.scheduledNotifications.clear();
  }

  // Schedule workout reminders for the week
  async scheduleWeeklyWorkoutReminders(
    workouts: Array<{
      id: string;
      exerciseName: string;
      week: number;
      day: number;
      scheduledDate: Date;
    }>
  ): Promise<string[]> {
    const status = this.getPermissionStatus();
    
    if (!status.granted) {
      console.warn('Cannot schedule notifications - permission not granted');
      return [];
    }

    const notificationIds: string[] = [];

    for (const workout of workouts) {
      // Schedule notification for 9 AM on the workout day
      const scheduledTime = new Date(workout.scheduledDate);
      scheduledTime.setHours(9, 0, 0, 0);

      if (scheduledTime.getTime() > Date.now()) {
        const notification: ScheduledNotification = {
          id: `workout-${workout.id}`,
          title: 'Workout Reminder 💪',
          body: `${workout.exerciseName} day! Week ${workout.week}, Day ${workout.day}`,
          scheduledTime,
          workoutId: workout.id,
        };

        this.scheduleNotification(notification);
        notificationIds.push(notification.id);
      }
    }

    return notificationIds;
  }
}

// Create and export singleton instance
export const notificationService = new NotificationService();

// Export class for testing
export { NotificationService };
