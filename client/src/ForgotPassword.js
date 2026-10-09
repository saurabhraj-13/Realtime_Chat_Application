import React, { useState } from "react";

function ForgotPassword({ onBackToLogin }) {
  const [step, setStep] = useState(1);

  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");


  const sendOTP = async (e) => {
    e.preventDefault();

    setError("");

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/forgot-password/send-otp",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            phoneNumber
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message);
        return;
      }

      setMessage("OTP sent successfully");

      setStep(2);

    } catch (error) {
      setError("Unable to connect to server");
    }
  };


  const resetPassword = async (e) => {
    e.preventDefault();

    setError("");

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/forgot-password/reset",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            phoneNumber,
            otp,
            newPassword
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message);
        return;
      }

      alert("Password reset successfully!");

      onBackToLogin();

    } catch (error) {
      setError("Unable to connect to server");
    }
  };


  if (step === 1) {
    return (
      <div>

        <h1>Forgot Password</h1>

        <form onSubmit={sendOTP}>

          <input
            type="tel"
            placeholder="+919905782647"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            required
          />

          {error && (
            <p style={{ color: "red" }}>
              {error}
            </p>
          )}

          <button type="submit">
            Send OTP
          </button>

        </form>

        <button onClick={onBackToLogin}>
          Back to Login
        </button>

      </div>
    );
  }


  return (
    <div>

      <h1>Reset Password</h1>

      <form onSubmit={resetPassword}>

        <input
          type="text"
          placeholder="Enter OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          maxLength="6"
          required
        />

        <input
          type="password"
          placeholder="New Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />

        {error && (
          <p style={{ color: "red" }}>
            {error}
          </p>
        )}

        <button type="submit">
          Reset Password
        </button>

      </form>

    </div>
  );
}

export default ForgotPassword;