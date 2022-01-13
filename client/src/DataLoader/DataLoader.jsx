import React, { useEffect, useState } from 'react';

export default function DataLoader({ src }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    setLoading(true);
    fetch(src, {
      method: 'GET',
      headers: {
        auth: localStorage.getItem('accessToken'),
      },
    })
      .then(async (res) => {
        try {
          setData((await res.json()).data);
        } catch (e) {
          console.error(e);
        }
      })
      .catch((e) => {
        setLoading(false);
        console.error(e);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [src]);

  return loading ? <div>Loading...</div> : <div>{data}</div>;
}
