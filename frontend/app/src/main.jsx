import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import SplashProvider from './components/splash/SplashProvider.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

// Force all dates in the app to display as WIB (Western Indonesia Time / UTC+7)
const originalToLocaleString = Date.prototype.toLocaleString;
const originalToLocaleTimeString = Date.prototype.toLocaleTimeString;
const originalToLocaleDateString = Date.prototype.toLocaleDateString;

Date.prototype.toLocaleString = function(locales, options) {
  const opts = { ...options, timeZone: 'Asia/Jakarta' };
  let res = originalToLocaleString.call(this, 'en-GB', opts);
  if (!res.includes('WIB')) res += ' WIB';
  return res;
};

Date.prototype.toLocaleTimeString = function(locales, options) {
  const opts = { ...options, timeZone: 'Asia/Jakarta' };
  let res = originalToLocaleTimeString.call(this, 'en-GB', opts);
  if (!res.includes('WIB')) res += ' WIB';
  return res;
};

Date.prototype.toLocaleDateString = function(locales, options) {
  const opts = { ...options, timeZone: 'Asia/Jakarta' };
  return originalToLocaleDateString.call(this, 'en-GB', opts);
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <SplashProvider>
        <App />
      </SplashProvider>
    </ErrorBoundary>
  </StrictMode>,
)
