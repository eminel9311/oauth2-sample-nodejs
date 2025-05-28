import { useEffect, useState } from "react";

function Callback() {
  const [info, setInfo] = useState({});
  const [userInfo, setUserInfo] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const error = params.get("error");

      if (error) {
        setError(error);
        return;
      }

      if (code) {
        try {
          // 1. Đổi code lấy token
          const tokenResponse = await fetch("http://localhost:3000/oauth2/token", {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              "Authorization": "Basic " + btoa("client1:secret1")
            },
            body: new URLSearchParams({
              grant_type: "authorization_code",
              code: code,
              redirect_uri: "http://localhost:5173/callback"
            }),
          });

          const tokenData = await tokenResponse.json();
          
          if (tokenData.error) {
            setError(tokenData.error);
            return;
          }

          // 2. Lấy thông tin user sử dụng token
          const userResponse = await fetch("http://localhost:3000/oauth2/userinfo", {
            headers: {
              Authorization: `Bearer ${tokenData.access_token}`,
            },
          });

          const userData = await userResponse.json();
          
          setInfo({
            code,
            state: params.get("state"),
            access_token: tokenData.access_token,
            token_type: tokenData.token_type,
            expires_in: tokenData.expires_in,
          });
          
          setUserInfo(userData);
        } catch (err) {
          setError(err.message);
        }
      }
    };

    handleCallback();
  }, []);

  if (error) {
    return (
      <div style={{ padding: 40, color: "red" }}>
        <h2>Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 40 }}>
      <h2>Authorization Successful!</h2>
      
      <div style={{ marginBottom: 20 }}>
        <h3>User Information</h3>
        {userInfo ? (
          <div style={{ background: "#f5f5f5", padding: 15, borderRadius: 5 }}>
            <p><strong>Username:</strong> {userInfo.username}</p>
            <p><strong>User ID:</strong> {userInfo.id}</p>
          </div>
        ) : (
          <p>Loading user information...</p>
        )}
      </div>

      <div>
        <h3>OAuth2 Response</h3>
        <pre style={{ background: "#f5f5f5", padding: 15, borderRadius: 5 }}>
          {JSON.stringify(info, null, 2)}
        </pre>
      </div>
    </div>
  );
}

export default Callback;
