// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App';
import './index.css';
import 'antd/dist/reset.css';
import '@ant-design/v5-patch-for-react-19';


ReactDOM.createRoot(document.getElementById('root')!).render(

  <Router>
    <App />
  </Router>

);