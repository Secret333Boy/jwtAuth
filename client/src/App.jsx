import React from 'react';
import './App.scss';
import DataLoader from './DataLoader/DataLoader.jsx';
import AuthOnly from './AuthOnly/AuthOnly.jsx';

function App() {
  return (
    <div className="App">
      <AuthOnly>
        <DataLoader
          src={(process.env.REACT_APP_BACKEND_ENDPOINT || '') + '/api/data'}
        />
      </AuthOnly>
    </div>
  );
}

export default App;
