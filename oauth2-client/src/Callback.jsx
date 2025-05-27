import { useEffect, useState } from "react";

function Callback() {
  const [info, setInfo] = useState({});

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setInfo({
      code: params.get("code"),
      state: params.get("state"),
      error: params.get("error"),
      error_description: params.get("error_description"),
    });
  }, []);

  return (
    <div style={{ padding: 40 }}>
      <h2>Callback Result</h2>
      <pre>{JSON.stringify(info, null, 2)}</pre>
    </div>
  );
}

export default Callback;
