import React, { useRef, useState } from 'react';
import './AuthOnly.scss';

export default function AuthOnly({ children }) {
  const [verified, setVerified] = useState(null);
  const emailInputRef = useRef();
  const passInputRef = useRef();
  const regInputRef = useRef();
  fetch('/api/validate', {
    method: 'GET',
    headers: { auth: localStorage.getItem('accessToken') },
  }).then(async (res) => {
    const data = await res.json();
    if (data === false && res.status === 401) {
      fetch('/api/refresh').then(async (res) => {
        const token = await res.json();
        if (token) {
          localStorage.setItem('accessToken', token);
          setVerified(true);
        }
      });
    }
    setVerified(data);
  });
  if (verified === false) {
    return (
      <form className="authForm">
        <input type="email" ref={emailInputRef} placeholder="Email" />
        <input type="password" ref={passInputRef} placeholder="Password" />
        <div>
          <input type="checkbox" name="reg" ref={regInputRef} />
          <label htmlFor="reg">register?</label>
        </div>
        <button
          onClick={(e) => {
            e.preventDefault();
            const email = emailInputRef.current.value;
            const password = passInputRef.current.value;
            const reg = regInputRef.current.checked;
            fetch(`/api/${reg ? 'register' : 'login'}`, {
              method: 'POST',
              body: JSON.stringify({ email, password }),
            }).then(async (res) => {
              const accessToken = await res.json();
              localStorage.setItem('accessToken', accessToken);
              window.location.reload();
            });
          }}
        >
          Log in
        </button>
      </form>
    );
  }
  if (verified === null) {
    return <div>Pending...</div>;
  }
  if (verified !== true) {
    return <div>{verified}</div>;
  }
  return (
    <div>
      {children}
      <button
        onClick={(e) => {
          e.preventDefault();
          localStorage.removeItem('accessToken');
          fetch('/api/logout');
          window.location.reload();
        }}
      >
        Log out
      </button>
    </div>
  );
}
