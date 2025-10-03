export interface NotificationConfig {
  email?: string;
  telegram?: {
    botToken: string;
    chatId: string;
  };
  discord?: {
    webhookUrl: string;
  };
}

export interface NotificationMessage {
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

class NotificationService {
  private config: NotificationConfig = {};

  // Set notification configuration
  setConfig(config: NotificationConfig) {
    this.config = config;
    // Store in localStorage for persistence
    localStorage.setItem('notification_config', JSON.stringify(config));
  }

  // Load configuration from localStorage
  loadConfig() {
    try {
      const stored = localStorage.getItem('notification_config');
      if (stored) {
        this.config = JSON.parse(stored);
      }
    } catch (err) {
      console.warn('Failed to load notification config:', err);
    }
  }

  // Send notification to all configured channels
  async send(notification: NotificationMessage) {
    const promises: Promise<void>[] = [];

    if (this.config.email) {
      promises.push(this.sendEmail(notification));
    }

    if (this.config.telegram) {
      promises.push(this.sendTelegram(notification));
    }

    if (this.config.discord) {
      promises.push(this.sendDiscord(notification));
    }

    await Promise.allSettled(promises);
  }

  // Send email notification
  private async sendEmail(notification: NotificationMessage) {
    try {
      if (!this.config.email) return;

      // In production, this would call your backend API
      // For now, we'll use a webhook service or SendGrid API
      const response = await fetch('/api/notifications/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: this.config.email,
          subject: `[DLMM Alert] ${notification.title}`,
          body: notification.message,
          type: notification.type,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send email notification');
      }

      console.log('Email notification sent to:', this.config.email);
    } catch (err) {
      console.error('Failed to send email notification:', err);
    }
  }

  // Send Telegram notification
  private async sendTelegram(notification: NotificationMessage) {
    try {
      if (!this.config.telegram) return;

      const { botToken, chatId } = this.config.telegram;

      const emoji = this.getEmoji(notification.type);
      const message = `${emoji} *${notification.title}*\n\n${notification.message}`;

      const response = await fetch(
        `https://api.telegram.org/bot${botToken}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: message,
            parse_mode: 'Markdown',
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to send Telegram notification');
      }

      console.log('Telegram notification sent');
    } catch (err) {
      console.error('Failed to send Telegram notification:', err);
    }
  }

  // Send Discord notification
  private async sendDiscord(notification: NotificationMessage) {
    try {
      if (!this.config.discord) return;

      const color = this.getDiscordColor(notification.type);

      const response = await fetch(this.config.discord.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embeds: [
            {
              title: notification.title,
              description: notification.message,
              color: color,
              timestamp: new Date().toISOString(),
              footer: {
                text: 'DLMM Pro Manager',
              },
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send Discord notification');
      }

      console.log('Discord notification sent');
    } catch (err) {
      console.error('Failed to send Discord notification:', err);
    }
  }

  // Get emoji for notification type
  private getEmoji(type: NotificationMessage['type']): string {
    switch (type) {
      case 'info':
        return 'ℹ️';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      case 'success':
        return '✅';
      default:
        return '📢';
    }
  }

  // Get Discord embed color
  private getDiscordColor(type: NotificationMessage['type']): number {
    switch (type) {
      case 'info':
        return 3447003; // Blue
      case 'warning':
        return 16776960; // Yellow
      case 'error':
        return 15158332; // Red
      case 'success':
        return 3066993; // Green
      default:
        return 9807270; // Gray
    }
  }

  // Notification shortcuts for common events
  async notifyPositionOutOfRange(positionId: string, currentPrice: number) {
    await this.send({
      type: 'warning',
      title: 'Position Out of Range',
      message: `Your position ${positionId.slice(0, 8)}... is out of range at price $${currentPrice.toFixed(2)}. Consider rebalancing.`,
      data: { positionId, currentPrice },
    });
  }

  async notifyRebalanceExecuted(positionId: string, oldRange: {lower: number; upper: number}, newRange: {lower: number; upper: number}) {
    await this.send({
      type: 'success',
      title: 'Position Rebalanced',
      message: `Position ${positionId.slice(0, 8)}... has been rebalanced.\nOld range: $${oldRange.lower.toFixed(2)} - $${oldRange.upper.toFixed(2)}\nNew range: $${newRange.lower.toFixed(2)} - $${newRange.upper.toFixed(2)}`,
      data: { positionId, oldRange, newRange },
    });
  }

  async notifyOrderExecuted(orderId: string, orderType: string, price: number) {
    await this.send({
      type: 'success',
      title: `${orderType} Order Executed`,
      message: `Your ${orderType} order ${orderId.slice(0, 8)}... was executed at price $${price.toFixed(2)}`,
      data: { orderId, orderType, price },
    });
  }

  async notifyHighFees(positionId: string, feesEarned: number) {
    await this.send({
      type: 'info',
      title: 'High Fees Earned',
      message: `Position ${positionId.slice(0, 8)}... has earned $${feesEarned.toFixed(2)} in fees. Consider collecting them.`,
      data: { positionId, feesEarned },
    });
  }

  async notifyPriceAlert(poolAddress: string, targetPrice: number, currentPrice: number) {
    await this.send({
      type: 'info',
      title: 'Price Alert Triggered',
      message: `Price alert for pool ${poolAddress.slice(0, 8)}... has been triggered.\nTarget: $${targetPrice.toFixed(2)}\nCurrent: $${currentPrice.toFixed(2)}`,
      data: { poolAddress, targetPrice, currentPrice },
    });
  }

  async notifyError(error: string, context?: string) {
    await this.send({
      type: 'error',
      title: 'Error Occurred',
      message: `${context ? `[${context}] ` : ''}${error}`,
      data: { error, context },
    });
  }
}

// Export singleton instance
export const notificationService = new NotificationService();

// Initialize on module load
if (typeof window !== 'undefined') {
  notificationService.loadConfig();
}
