import React, { useState } from 'react';

export default function DataLoader({ src }) {
  const [data, setData] = useState(null);
  fetch(src).then(async (res) => {
    try {
      setData((await res.json()).data);
    } catch (e) {
      console.error(e);
    }
  });

  return <div>{data}</div>;
}
