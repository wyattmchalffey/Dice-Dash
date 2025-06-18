// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { GameProvider } from './contexts/GameContext'; // <-- IMPORT

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        {/* // MODIFIED: Wrap App in GameProvider */}
        <GameProvider>
            <App />
        </GameProvider>
    </React.StrictMode>
);

reportWebVitals();