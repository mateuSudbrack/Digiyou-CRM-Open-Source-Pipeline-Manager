import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { crmService } from '../services/crmService';
import Modal from './Modal'; // Assuming a generic Modal component exists

interface UserEditModalProps {
  user: UserProfile;
  onClose: () => void;
}

const UserEditModal: React.FC<UserEditModalProps> = ({ user, onClose }) => {
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(user.role);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    setRole(user.role);
    setPassword(''); // Password should always be reset for security
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      const updates: { password?: string, role?: string } = {};
      if (password) {
        updates.password = password;
      }
      if (role !== user.role) {
        updates.role = role;
      }

      if (Object.keys(updates).length === 0) {
        setMessage('No changes to save.');
        return;
      }

      await crmService.updateUser(user.username, updates);
      setMessage('User updated successfully!');
      // Optionally close modal after a short delay or on user action
      setTimeout(onClose, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to update user.');
    }
  };

  return (
    <Modal isOpen={true} title={`Edit User: ${user.username}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-300">Username (Email)</label>
          <input
            id="username"
            type="email"
            value={user.username}
            className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white cursor-not-allowed"
            disabled
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-300">New Password (leave blank to keep current)</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            minLength={4}
          />
        </div>
        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-300">Role</label>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value as 'superadmin' | 'admin' | 'user')}
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
            Save Changes
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default UserEditModal;