import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './lib/auth.jsx';
import { ToastProvider } from './components/ui.jsx';
import './index.css';

class Boundary extends React.Component {
  state = { err: null };
  static getDerivedStateFromError(err) { return { err }; }
  render() {
    if (!this.state.err) return this.props.children;
    return <div className="mx-auto max-w-md p-10 text-center"><h1 className="text-xl font-bold">Something broke on this page</h1><p className="mt-2 text-sm text-muted">Reload to try again. If it keeps happening, contact support.</p><button className="btn-primary mt-4" onClick={() => location.reload()}>Reload</button></div>;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode><Boundary><BrowserRouter><ToastProvider><AuthProvider><App /></AuthProvider></ToastProvider></BrowserRouter></Boundary></React.StrictMode>,
);
