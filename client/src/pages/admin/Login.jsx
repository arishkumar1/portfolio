import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Eye, EyeOff, LockKeyhole, UserRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const { user, login } = useAuth();
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [shake, setShake] = useState(false);

  if (user) return <Navigate to="/admin" replace />;

  async function submit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    const form = new FormData(event.currentTarget);
    const credentials = Object.fromEntries(form);
    try {
      await login({ username: credentials.username.trim(), password: credentials.password });
      location.href = '/admin';
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check your details and try again.');
      setShake(true);
      window.setTimeout(() => setShake(false), 550);
    } finally {
      setSubmitting(false);
    }
  }

  return <main className="login login-scene">
    <div className="login-glow login-glow-a"/><div className="login-glow login-glow-b"/>
    <form className={`form panel login-card${shake ? ' login-shake' : ''}`} onSubmit={submit}>
      <div className="login-brand"><span>PORTFOLIO <b>ADMIN</b></span></div>
      <div className="login-heading"><p className="login-eyebrow">SECURE ACCESS</p><h1>Welcome back</h1><p>Sign in to manage your portfolio.</p></div>
      <label className="login-label" htmlFor="admin-username">Admin</label>
      <div className="login-input-wrap"><UserRound size={18}/><input id="admin-username" name="username" autoComplete="username" placeholder="Admin" required value={username} onChange={e=>setUsername(e.target.value)} aria-invalid={Boolean(error)}/></div>
      <label className="login-label" htmlFor="admin-password">Password</label>
      <div className="login-input-wrap"><LockKeyhole size={18}/><input id="admin-password" name="password" type={showPassword?'text':'password'} autoComplete="current-password" placeholder="Your password" required aria-invalid={Boolean(error)}/><button className="password-toggle" type="button" onClick={()=>setShowPassword(v=>!v)} aria-label={showPassword?'Hide password':'Show password'}>{showPassword?<EyeOff size={18}/>:<Eye size={18}/>}</button></div>
      <div className="login-options"><span className="forgot-note" title="Ask the site owner to reset your admin password">Forgot password?</span></div>
      {error&&<p className="login-error" role="alert">{error}</p>}
      <button className="login-submit" disabled={submitting}>{submitting&&<span className="login-spinner"/>}{submitting?'Signing in…':'Sign in to dashboard'}</button>
      <p className="login-footnote">Your session is protected with secure authentication.</p>
    </form>
  </main>;
}
