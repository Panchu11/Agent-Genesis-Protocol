'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Notification, NotificationProps } from '@/app/components/common/Notification';

type NotificationWithoutOnClose = Omit<NotificationProps, 'onClose'>;

interface NotificationContextType {
  showNotification: (notification: NotificationWithoutOnClose) => void;
  hideNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationProps[]>([]);

  const showNotification = useCallback((notification: NotificationWithoutOnClose) => {
    setNotifications(prev => [...prev, { ...notification, onClose: () => hideNotification(notification.id) }]);
  }, []);

  const hideNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  return (
    <NotificationContext.Provider value={{ showNotification, hideNotification }}>
      {children}
      <div className="fixed bottom-0 right-0 p-4 space-y-4 z-50">
        {notifications.map(notification => (
          <Notification key={notification.id} {...notification} />
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}
