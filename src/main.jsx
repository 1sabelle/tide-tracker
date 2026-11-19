import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { requestPersistentStorage } from './storage.js';
import '@fontsource-variable/figtree';
import '@fontsource-variable/fraunces/full.css';
import './styles.css';

requestPersistentStorage();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
