import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from './pages/home';
import Admin from './componentes/perguntas';

const root = ReactDOM.createRoot(document.getElementById('app'));

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<Admin />} />   {/* ⬅ rota criada */}

      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
