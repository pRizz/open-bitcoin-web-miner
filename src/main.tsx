import React from "react";
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "https://06705b2093f545735c2624f6b1124dee@o4508882504450048.ingest.us.sentry.io/4509573689180160",
  // Setting this option to true will send default PII data to Sentry.
  // For example, automatic IP address collection on events
  sendDefaultPii: true
});

createRoot(
    document.getElementById("root")!,
    {
      // Uncomment once on React 19
      // Callback called when an error is thrown and not caught by an ErrorBoundary.
      // onUncaughtError: Sentry.reactErrorHandler((error, errorInfo) => {
      //   console.warn('Uncaught error', error, errorInfo.componentStack);
      // }),
      // Callback called when React catches an error in an ErrorBoundary.
      // onCaughtError: Sentry.reactErrorHandler(),
      // Callback called when React automatically recovers from errors.
      onRecoverableError: Sentry.reactErrorHandler(),
    }
).render(<App />);
