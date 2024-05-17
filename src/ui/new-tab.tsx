import React from 'react';
import type { Root } from 'react-dom/client';
import { createRoot } from 'react-dom/client';
import { NewTab } from './NewTab';

let reactRoot: Root | null = null;

function renderNewtab() {
  const root = document.getElementById('root');
  if (!root) {
    throw new Error('#root element not found');
  }

  if (reactRoot) {
    reactRoot.unmount();
  }
  reactRoot = createRoot(root);
  reactRoot.render(
    <React.StrictMode>
      <NewTab />
    </React.StrictMode>
  );
}

renderNewtab();
