

import React, { useState } from 'react';
import { crmService } from '../services/crmService';

interface AuthProps {
  onAuthSuccess: (user: { username: string; companyId: string }) => void;
}

const Auth: React.FC<AuthProps> = ({ onAuthSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'message' | 'verify'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [emailForVerification, setEmailForVerification] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const resetForm = () => {
    setUsername('');
    setPassword('');
    setCompanyName('');
    setVerificationCode('');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
        if (mode === 'login') {
            const user = await crmService.login(username, password);
            if (user) onAuthSuccess(user);
        } else if (mode === 'register') {
            if (password.length < 4) throw new Error('Password must be at least 4 characters long.');
            if (!companyName.trim()) throw new Error('Company name is required.');
            await crmService.register(username, password, companyName);
            setEmailForVerification(username);
            setMode('verify');
            setPassword('');
            setCompanyName('');
        } else if (mode === 'forgot') {
            const result = await crmService.forgotPassword(username);
            setMessage(result.message);
            setMode('message');
        }
    } catch (err: any) {
        setError(err.message || 'An error occurred.');
    } finally {
        setIsLoading(false);
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
        const result = await crmService.verifyCode(emailForVerification, verificationCode);
        setMessage(result.message);
        setMode('message');
    } catch (err: any) {
        setError(err.message || 'Verification failed.');
    } finally {
        setIsLoading(false);
    }
  };
  
  const getTitle = () => {
      if (mode === 'login') return 'Please sign in to continue';
      if (mode === 'register') return 'Create your account';
      if (mode === 'forgot') return 'Reset Your Password';
      if (mode === 'verify') return 'Check Your Email';
      return 'Check Your Email';
  };

  if (mode === 'message') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-lg shadow-lg border border-gray-700 text-center">
          <h2 className="text-2xl font-bold">{getTitle()}</h2>
          <p className="text-gray-300">{message}</p>
          <button
            onClick={() => { setMode('login'); resetForm(); }}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 rounded-md text-white font-bold transition-colors"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  if (mode === 'verify') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-lg shadow-lg border border-gray-700">
          <div className="text-center">
            <h2 className="text-2xl font-bold">{getTitle()}</h2>
            <p className="mt-2 text-gray-400">We've sent a 6-digit verification code to <br/><strong>{emailForVerification}</strong></p>
          </div>
          <form className="space-y-6" onSubmit={handleVerifySubmit}>
            <div>
              <label htmlFor="verificationCode" className="text-sm font-bold text-gray-300 tracking-wide">Verification Code</label>
              <input 
                id="verificationCode" 
                type="text" 
                value={verificationCode} 
                onChange={(e) => setVerificationCode(e.target.value)} 
                className="mt-2 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-4 text-white text-center text-2xl tracking-[0.5em]"
                maxLength={6}
                required 
              />
            </div>
            {error && <p className="text-red-400 text-sm text-center bg-red-500/10 p-2 rounded-md">{error}</p>}
            <div>
              <button 
                type="submit" 
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 rounded-md text-white font-bold text-lg transition-colors duration-200 disabled:opacity-50" 
                disabled={isLoading}
              >
                {isLoading ? 'Verifying...' : 'Verify Account'}
              </button>
            </div>
          </form>
           <div className="text-center text-sm text-gray-400">
            <p>Didn't get a code? <button onClick={() => { setMode('login'); resetForm(); }} className="font-medium text-blue-400 hover:underline">Go back and try registering again.</button></p>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
      <div className="w-full max-w-md p-8 space-y-8 bg-gray-800 rounded-lg shadow-lg border border-gray-700">
        <div className="text-center">
            <h1 className="text-4xl font-bold text-white">
                DigiYou<span className="text-blue-400">CRM</span>
            </h1>
            <p className="mt-2 text-gray-400">{getTitle()}</p>
        </div>
        <form className="space-y-6" onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div>
              <label htmlFor="companyName" className="text-sm font-bold text-gray-300 tracking-wide">Company Name</label>
              <input id="companyName" type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="mt-2 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Your Company Inc." required />
            </div>
          )}
          
          <div>
            <label htmlFor="username" className="text-sm font-bold text-gray-300 tracking-wide">{mode === 'forgot' ? 'Email Address' : 'Email Address / Username'}</label>
            <input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="mt-2 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter your email" required />
          </div>

          {mode !== 'forgot' && (
            <div>
              <label htmlFor="password" className="text-sm font-bold text-gray-300 tracking-wide">Password</label>
              <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter your password" required />
            </div>
          )}
          
          {mode === 'login' && (
            <div className="text-right text-sm">
                <button type="button" onClick={() => { setMode('forgot'); resetForm(); }} className="font-medium text-blue-400 hover:underline">
                    Forgot Password?
                </button>
            </div>
          )}

          {error && <p className="text-red-400 text-sm text-center bg-red-500/10 p-2 rounded-md">{error}</p>}
          
          <div>
            <button type="submit" className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 rounded-md text-white font-bold text-lg transition-colors duration-200 disabled:opacity-50" disabled={isLoading}>
              {isLoading ? 'Processing...' : (mode === 'login' ? 'Login' : mode === 'register' ? 'Register' : 'Send Reset Link')}
            </button>
          </div>
        </form>
         <div className="text-center text-sm text-gray-400">
            {mode === 'login' && <p>Don't have an account? <button onClick={() => { setMode('register'); resetForm(); }} className="font-medium text-blue-400 hover:underline">Register</button></p>}
            {mode === 'register' && <p>Already have an account? <button onClick={() => { setMode('login'); resetForm(); }} className="font-medium text-blue-400 hover:underline">Login</button></p>}
            {mode === 'forgot' && <p>Remember your password? <button onClick={() => { setMode('login'); resetForm(); }} className="font-medium text-blue-400 hover:underline">Login</button></p>}
        </div>
      </div>
    </div>
  );
};

export default Auth;