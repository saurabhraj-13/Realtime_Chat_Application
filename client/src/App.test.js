import { render, screen } from '@testing-library/react';
import App from './App';

jest.mock('./Chat', () => () => <div>Chat page</div>);
jest.mock('./Login', () => ({ onLogin, onRegister }) => (
  <div>
    <h1>Welcome to ChatWave</h1>
    <button onClick={() => onLogin({ username: 'demo-user' })}>Login</button>
    <button onClick={onRegister}>Create Account</button>
  </div>
));
jest.mock('./Register', () => () => <div>Register page</div>);
jest.mock('./ForgotPassword', () => () => <div>Forgot password page</div>);
jest.mock('./DeviceTransfer', () => () => <div>Transfer page</div>);

test('renders the login screen by default', () => {
  render(<App />);
  expect(screen.getByText(/Welcome to ChatWave/i)).toBeInTheDocument();
});
