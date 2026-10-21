import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const BUILD_VERSION = '2.5.0-20261021';

// Ensure any stale PWA Service Worker caches are immediately wiped & refreshed on load
if (typeof window !== 'undefined') {
  const prevVersion = localStorage.getItem('infracore_build_version');
  if (prevVersion !== BUILD_VERSION) {
    localStorage.setItem('infracore_build_version', BUILD_VERSION);
    if ('caches' in window) {
      caches.keys().then(names => Promise.all(names.map(n => caches.delete(n)))).catch(() => {});
    }
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        Promise.all(registrations.map(r => r.unregister())).then(() => {
          if (registrations.length > 0) {
            window.location.reload();
          }
        });
      }).catch(() => {});
    }
  } else if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      for (const registration of registrations) {
        registration.unregister().catch(() => {});
      }
    }).catch(() => {});
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);