"use client";

/**
 * Novu Notification Provider
 *
 * Client-side notification center integration for the BlackGoldUnited ERP system.
 * Provides real-time in-app notifications using Novu's notification center.
 */

import React, { ReactNode } from 'react';
import {
  NovuProvider,
  PopoverNotificationCenter,
  NotificationBell,
  IMessage,
} from '@novu/notification-center';

interface NovuNotificationProviderProps {
  children: ReactNode;
  userId: string;
  applicationIdentifier: string;
}

export function NovuNotificationProvider({
  children,
  userId,
  applicationIdentifier,
}: NovuNotificationProviderProps) {
  return (
    <NovuProvider
      subscriberId={userId}
      applicationIdentifier={applicationIdentifier}
    >
      {children}
    </NovuProvider>
  );
}

interface NotificationCenterProps {
  colorScheme?: 'light' | 'dark';
}

export function NotificationCenter({ colorScheme = 'light' }: NotificationCenterProps) {
  const onNotificationClick = (message: IMessage) => {
    // Handle notification click - navigate to relevant page
    if (message.payload?.redirectUrl) {
      window.location.href = message.payload.redirectUrl as string;
    }
  }

  return (
    <PopoverNotificationCenter
      onNotificationClick={onNotificationClick}
      colorScheme={colorScheme}
    >
      {({ unseenCount }) => (
        <NotificationBell unseenCount={unseenCount} />
      )}
    </PopoverNotificationCenter>
  );
}

// Export components for use in the app
export { NotificationBell };