import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ClerkProvider, SignedIn, SignedOut, SignIn, UserButton } from '@clerk/clerk-react';
import Dashboard from './components/Dashboard';
import './App.css';

// Import your publishable key
const PUBLISHABLE_KEY = 'pk_test_cG9saXRlLWdvc2hhd2stNDAuY2xlcmsuYWNjb3VudHMuZGV2JA';

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key");
}

function App() {
  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <Router>
        <div className="App">
          <SignedIn>
            <Routes>
              <Route path="/" element={<Dashboard />} />
            </Routes>
          </SignedIn>
          <SignedOut>
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
              <SignIn />
            </div>
          </SignedOut>
        </div>
      </Router>
    </ClerkProvider>
  );
}

export default App;
