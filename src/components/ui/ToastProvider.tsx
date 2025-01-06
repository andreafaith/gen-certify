import React from 'react';
import {
  ToastProvider as Provider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
} from './Toast';

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider>
      {children}
      <ToastViewport />
    </Provider>
  );
}

export function Toaster() {
  return (
    <ToastProvider>
      <Toast>
        <div className="grid gap-1">
          <ToastTitle />
          <ToastDescription />
        </div>
        <ToastClose />
      </Toast>
    </ToastProvider>
  );
}
