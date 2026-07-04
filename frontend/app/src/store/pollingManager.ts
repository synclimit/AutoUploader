type PollingAction = () => Promise<void>;

interface PollingTask {
  action: PollingAction;
  intervalMs: number;
  intervalId?: ReturnType<typeof setInterval>;
}

class PollingManager {
  private tasks: Map<string, PollingTask> = new Map();
  private isVisible: boolean = true;

  constructor() {
    if (typeof document !== 'undefined') {
      this.isVisible = document.visibilityState === 'visible';
      document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    }
  }

  private handleVisibilityChange() {
    this.isVisible = document.visibilityState === 'visible';
    if (this.isVisible) {
      this.resumeAll();
    } else {
      this.pauseAll();
    }
  }

  public start(key: string, action: PollingAction, intervalMs: number) {
    this.stop(key);
    
    this.tasks.set(key, { action, intervalMs });
    
    // Execute immediately
    action().catch(console.error);

    if (this.isVisible) {
      this.resumeTask(key);
    }
  }

  public stop(key: string) {
    const task = this.tasks.get(key);
    if (task && task.intervalId) {
      clearInterval(task.intervalId);
    }
    this.tasks.delete(key);
  }

  private pauseAll() {
    for (const [key, task] of this.tasks.entries()) {
      if (task.intervalId) {
        clearInterval(task.intervalId);
        task.intervalId = undefined;
      }
    }
  }

  private resumeAll() {
    for (const key of this.tasks.keys()) {
      this.resumeTask(key);
    }
  }

  private resumeTask(key: string) {
    const task = this.tasks.get(key);
    if (task && !task.intervalId) {
      task.intervalId = setInterval(() => {
        task.action().catch(console.error);
      }, task.intervalMs);
    }
  }
}

export const pollingManager = new PollingManager();
