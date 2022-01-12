import React, { useState } from 'react';

export default function DataLoader({ src }) {
  const [data, setData] = useState(null);
  fetch(src, {
    method: 'GET',
    headers: {
      auth: localStorage.getItem('accessToken'),
    },
  }).then(async (res) => {
    try {
      setData((await res.json()).data);
    } catch (e) {
      console.error(e);
    }
  }).catch((e) => {
    console.error(e);
  });

  return <div>{data}</div>;
}
