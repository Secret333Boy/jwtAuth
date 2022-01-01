import React from 'react';
import './App.scss';
import DataLoader from './DataLoader/DataLoader.jsx';

function App() {
  return (
    <div className="App">
      <DataLoader src="/api/data" />
    </div>
  );
}

export default App;
