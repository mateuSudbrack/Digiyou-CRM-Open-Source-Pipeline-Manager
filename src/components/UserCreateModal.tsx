import React, { useState } from 'react';
import { Company } from '../types';
import { crmService } from '../services/crmService';
import Modal from './Modal';

interface UserCreateModalProps {
  companies: Company[];
  onClose: () => void;
  onUserCreated: () => void;
}

const UserCreateModal: React.FC<UserCreateModalProps> = ({ companies, onClose, onUserCreated }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [companyId, setCompanyId] = useState<string>(companies[0]?.id || '');
  const [role, setRole] = useState('user');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (password.length < 4) {
        setError('Password must be at least 4 characters long.');
        return;
    }

    try {
      await crmService.createUserAsSuperAdmin(username, password, companyId, role);
      setMessage('User created successfully!');
      onUserCreated();
      setTimeout(onClose, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to create user.');
    }
  };

  return (
    <Modal isOpen={true} title="Create New User" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-300">Username (Email)</label>
          <input
            id="username"
            type="email"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-300">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            minLength={4}
            required
          />
        </div>
        <div>
          <label htmlFor="company" className="block text-sm font-medium text-gray-300">Company</label>
          <select
            id="company"
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            {companies.map(company => (
              <option key={company.id} value={company.id}>{company.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-300">Role</label>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
            <option value="superadmin">Super Admin</option>
          </select>
        </div>
        {error && <p className="text-red-400">{error}</p>}
        {message && <p className="text-green-400">{message}</p>}
        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-md text-white font-bold"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white font-bold"
          >
            Create User
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default UserCreateModal;
