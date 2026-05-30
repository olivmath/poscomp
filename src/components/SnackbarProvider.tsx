import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type NotificationType = 'success' | 'error' | 'info';

interface Notification {
  id: string;
  message: string;
  type: NotificationType;
  duration: number;
}

interface SnackbarContextType {
  show: (message: string, type: NotificationType, duration?: number) => void;
}

const SnackbarContext = createContext<SnackbarContextType | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export function useSnackbar(): SnackbarContextType {
  const context = useContext(SnackbarContext);
  if (!context) {
    throw new Error('useSnackbar deve ser usado dentro de SnackbarProvider');
  }
  return context;
}

interface SnackbarProviderProps {
  children: ReactNode;
}

export function SnackbarProvider({ children }: SnackbarProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const show = useCallback(
    (message: string, type: NotificationType = 'info', duration = 3000) => {
      const id = Date.now().toString();
      const notification: Notification = { id, message, type, duration };

      setNotifications((prev) => [...prev, notification]);

      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }, duration);
    },
    []
  );

  return (
    <SnackbarContext.Provider value={{ show }}>
      {children}
      <Snackbar notifications={notifications} onDismiss={(id) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }} />
    </SnackbarContext.Provider>
  );
}

interface SnackbarProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
}

function Snackbar({ notifications, onDismiss }: SnackbarProps) {
  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return 'check_circle';
      case 'error':
        return 'error';
      case 'info':
        return 'info';
      default:
        return 'info';
    }
  };

  const getColor = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return 'var(--md-sys-color-primary)';
      case 'error':
        return 'var(--md-sys-color-error)';
      case 'info':
        return 'var(--md-sys-color-secondary)';
      default:
        return 'var(--md-sys-color-secondary)';
    }
  };

  return (
    <div className="snackbar-container" role="status" aria-live="assertive">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`snackbar-item snackbar-item--${notification.type}`}
          style={{ borderLeftColor: getColor(notification.type) }}
        >
          <md-icon className="snackbar-icon">{getIcon(notification.type)}</md-icon>
          <span className="snackbar-message">{notification.message}</span>
          <button
            className="snackbar-close"
            onClick={() => onDismiss(notification.id)}
            aria-label="Fechar notificação"
            type="button"
          >
            <md-icon>close</md-icon>
          </button>
        </div>
      ))}
    </div>
  );
}
