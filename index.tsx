import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Ensure any stale PWA Service Worker caches are immediately refreshed on load
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    for (const registration of registrations) {
      registration.update().catch(() => {});
    }
  }).catch(() => {});
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