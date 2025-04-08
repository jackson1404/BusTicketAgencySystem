if (typeof global === "undefined") {
  var global = window; // Polyfill for global object in the browser
}

import React from 'react';
import RouteSelector from './components/RouteSelector';

function App() {
  return (
    <div>
      <RouteSelector />
      
    </div>
  );
}

export default App;
