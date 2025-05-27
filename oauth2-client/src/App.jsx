function App() {
  const handleLogin = () => {
    const params = new URLSearchParams({
      client_id: "client1",
      response_type: "code",
      redirect_uri: "http://localhost:5173/callback",
      scope: "read",
      state: "random123"
    });

    window.location.href = `http://localhost:3000/oauth2/authorize?${params.toString()}`;
  };

  return (
    <div style={{ padding: 40, fontFamily: "sans-serif", textAlign: "center" }}>
      <h1>Welcome to the Client App</h1>
      <button
        onClick={handleLogin}
        style={{
          padding: "12px 24px",
          fontSize: "16px",
          backgroundColor: "#4CAF50",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer"
        }}
      >
        🔐 Đăng nhập bằng super-cute-app
      </button>
    </div>
  );
}

export default App;
