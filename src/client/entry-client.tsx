import { hydrateRoot } from 'react-dom/client';
import { Providers } from './Providers';
import { App } from './App';
import { readInitialState } from './initialState';
import './components/styles/global.css';

const state = readInitialState();
const url = window.location.pathname + window.location.search;

hydrateRoot(
  document.getElementById('app')!,
  <Providers url={url} user={state.user} initialData={state.data}>
    <App />
  </Providers>
);
