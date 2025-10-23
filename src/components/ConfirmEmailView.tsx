
import React, { useState, useEffect } from 'react';
import { crmService } from '../services/crmService';
import { CheckCircleIcon } from './icons'; // Assuming you have this icon

interface ConfirmEmailViewProps {
  token: string;
  navigate: (path: string) => void;
}

const ConfirmEmailView: React.FC<ConfirmEmailViewProps> = ({ token, navigate }) => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Confirming your email address...');

  useEffect(() => {
    const confirm = async () => {
      try {
        const result = await crmService.confirmEmail(token);
        setStatus('success');
        setMessage(result.message);
      } catch (err: any) {
        setStatus('error');
        setMessage(err.message || 'An unknown error occurred.');
      }
    };
    confirm();
  }, [token]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
      <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-lg shadow-lg border border-gray-700 text-center">
        {status === 'loading' && <p>{message}</p>}
        {status === 'success' && (
          <div className="space-y-4">
            <CheckCircleIcon className="mx-auto h-12 w-12 text-green-400" />
            <h2 className="text-2xl font-bold text-green-300">Success!</h2>
            <p className="text-gray-300">{message}</p>
            <button
              onClick={() => navigate('/login')}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 rounded-md text-white font-bold transition-colors"
            >
              Proceed to Login
            </button>
          </div>
        )}
        {status === 'error' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-red-400">Error</h2>
            <p className="text-red-300 bg-red-500/10 p-3 rounded-md">{message}</p>
            <button
              onClick={() => navigate('/login')}
              className="w-full py-3 px-4 bg-gray-600 hover:bg-gray-700 rounded-md text-white font-bold transition-colors"
            >
              Back to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConfirmEmailView;
