import React, { useRef, useState } from 'react';
import Message from './Message/Message.jsx';
import './AuthOnly.scss';
import spinner from './MkTK.gif';

export default function AuthOnly({ children }) {
  const [verified, setVerified] = useState(null);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const emailInputRef = useRef();
  const passInputRef = useRef();
  const regInputRef = useRef();
  fetch('/api/validate', {
    method: 'GET',
    headers: { auth: localStorage.getItem('accessToken') },
  })
    .then(async (valRes) => {
      if (valRes.status === 200) {
        setVerified(await valRes.json());
        return;
      }
      const data = await valRes.json();
      if (data === false && valRes.status === 401) {
        const refRes = await fetch('/api/refresh');
        if (refRes.status === 200) {
          const token = await refRes.json();
          localStorage.setItem('accessToken', token);
          setVerified(true);
        } else {
          console.error(refRes.statusText);
          setVerified(false);
        }
      } else {
        setVerified(valRes.statusText);
      }
    })
    .catch((e) => {
      setVerified(false);
      console.error(e);
    });
  if (verified === false) {
    return (
      <>
        <Message messageHandler={setMessage}>{message}</Message>
        <form className="authForm">
          <input type="email" ref={emailInputRef} placeholder="Email" />
          <input type="password" ref={passInputRef} placeholder="Password" />
          <div>
            <input type="checkbox" name="reg" ref={regInputRef} />
            <label htmlFor="reg">register?</label>
          </div>
          {loading ? (
            <div className="spinner">
              <img src={spinner} alt="" />
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.preventDefault();
                const email = emailInputRef.current.value;
                const password = passInputRef.current.value;
                const reg = regInputRef.current.checked;
                setLoading(true);
                fetch(`/api/${reg ? 'register' : 'login'}`, {
                  method: 'POST',
                  body: JSON.stringify({ email, password }),
                  headers: {
                    'Content-Type': 'application/json',
                  },
                })
                  .then(async (res) => {
                    setLoading(false);
                    if (res.status === 200) {
                      const accessToken = await res.json();
                      localStorage.setItem('accessToken', accessToken);
                      window.location.reload();
                    } else {
                      setMessage(res.statusText);
                    }
                  })
                  .catch((e) => {
                    console.error(e);
                  });
              }}
            >
              Log in
            </button>
          )}
        </form>
      </>
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