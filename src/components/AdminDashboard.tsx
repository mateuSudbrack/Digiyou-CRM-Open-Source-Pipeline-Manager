import React, { useState, useEffect } from 'react';
import { crmService } from '../services/crmService';
import { Company, UserProfile, CurrentUser } from '../types';
import UserEditModal from './UserEditModal';
import CompanyEditModal from './CompanyEditModal';
import UserCreateModal from './UserCreateModal';

interface AdminDashboardProps {
  onClose: () => void;
  currentUser: CurrentUser;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose, currentUser }) => {
  const [companyName, setCompanyName] = useState('');
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [isCompanyEditModalOpen, setIsCompanyEditModalOpen] = useState(false);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Creation Code State
  const [creationCode, setCreationCode] = useState('');
  const [originalCreationCode, setOriginalCreationCode] = useState('');
  const [isCodeLoading, setIsCodeLoading] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);

  const fetchCompanies = async () => {
    try {
      const companyList = await crmService.getCompanies();
      setCompanies(companyList);
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching companies.');
    }
  };

  const fetchUsers = async () => {
    try {
      const userList = await crmService.getAllUsersForSuperAdmin();
      setUsers(userList);
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching users.');
    }
  };

  const fetchCreationCode = async () => {
      if (currentUser.role === 'superadmin') {
          try {
              setIsCodeLoading(true);
              const { code } = await crmService.getCreationCode();
              setCreationCode(code);
              setOriginalCreationCode(code);
          } catch (err) {
              setCodeError('Failed to fetch creation code.');
              console.error(err);
          } finally {
              setIsCodeLoading(false);
          }
      }
  };

  useEffect(() => {
    fetchCompanies();
    fetchUsers();
    fetchCreationCode();
  }, [currentUser.role]);

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await crmService.createCompany(companyName, adminUsername, adminPassword);
      setCompanyName('');
      setAdminUsername('');
      setAdminPassword('');
      setMessage(`Company "${companyName}" created successfully with admin user "${adminUsername}".`);
      fetchCompanies(); // Refresh the list
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    }
  };

  const handleDeleteCompany = async (companyId: string) => {
    if (window.confirm('Are you sure you want to delete this company?')) {
      try {
        await crmService.deleteCompany(companyId);
        fetchCompanies(); // Refresh the list
      } catch (err: any) {
        setError(err.message || 'An error occurred while deleting the company.');
      }
    }
  };

  const handleEditCompany = (company: Company) => {
    setEditingCompany(company);
    setIsCompanyEditModalOpen(true);
  };

  const handleCloseCompanyEditModal = () => {
    setIsCompanyEditModalOpen(false);
    setEditingCompany(null);
    fetchCompanies(); // Refresh companies after potential edit
  };

  const handleEditUser = (user: UserProfile) => {
    setEditingUser(user);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingUser(null);
    fetchUsers(); // Refresh users after potential edit
  };

  const handleUserCreated = () => {
    fetchUsers();
  };

  const handleSaveCreationCode = async () => {
      try {
          setIsCodeLoading(true);
          setCodeError(null);
          await crmService.updateCreationCode(creationCode);
          setOriginalCreationCode(creationCode);
      } catch (err) {
          setCodeError('Failed to save creation code.');
          console.error(err);
      } finally {
          setIsCodeLoading(false);
      }
  };

  return (
    <div className="p-4 text-white">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <button onClick={onClose} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-md text-white font-bold">
          Close
        </button>
      </div>
      <p className="mb-8">Welcome to the admin dashboard. Here you can manage companies and users.</p>

      {/* Statistics Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-lg font-bold">Total Companies</h3>
          <p className="text-2xl">{companies.length}</p>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-lg font-bold">Total Users</h3>
          <p className="text-2xl">{users.length}</p>
        </div>
        {/* Add more statistics here if needed */}
      </div>

      {/* System Settings Section */}
      {currentUser.role === 'superadmin' && (
          <div className="bg-gray-800 p-6 rounded-lg mb-8">
              <h2 className="text-xl font-bold mb-4">System Settings</h2>
              <div className="max-w-md">
                  <label htmlFor="creationCode" className="block text-sm font-medium text-gray-300 mb-1">
                      Company Creation Code
                  </label>
                  {isCodeLoading && <p className="text-sm text-gray-400">Loading code...</p>}
                  {codeError && <p className="text-sm text-red-400">{codeError}</p>}
                  <div className="flex items-center space-x-2">
                      <input
                          id="creationCode"
                          type="text"
                          value={creationCode}
                          onChange={(e) => setCreationCode(e.target.value)}
                          className="flex-grow p-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-blue-500 focus:border-blue-500"
                          disabled={isCodeLoading}
                      />
                      <button
                          onClick={handleSaveCreationCode}
                          disabled={isCodeLoading || creationCode === originalCreationCode}
                          className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md shadow-sm hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed"
                      >
                          {isCodeLoading ? 'Saving...' : 'Save'}
                      </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">This code is required for new users to create a company.</p>
              </div>
          </div>
      )}

      {/* Manage Companies Section */}
      <div className="bg-gray-800 p-6 rounded-lg mb-8">
        <h2 className="text-xl font-bold mb-4">Manage Companies</h2>
        <form onSubmit={handleCreateCompany} className="space-y-4 mb-8">
          <h3 className="text-lg font-bold">Create New Company</h3>
          <div>
            <label htmlFor="companyName" className="block text-sm font-medium text-gray-300">Company Name</label>
            <input
              id="companyName"
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label htmlFor="adminUsername" className="block text-sm font-medium text-gray-300">Admin Username (Email)</label>
            <input
              id="adminUsername"
              type="email"
              value={adminUsername}
              onChange={(e) => setAdminUsername(e.target.value)}
              className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label htmlFor="adminPassword" className="block text-sm font-medium text-gray-300">Admin Password</label>
            <input
              id="adminPassword"
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          {error && <p className="text-red-400">{error}</p>}
          {message && <p className="text-green-400">{message}</p>}
          <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white font-bold">
            Create Company
          </button>
        </form>

        <h3 className="text-lg font-bold mb-4">Existing Companies</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Company Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Users
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {companies.map((company) => (
                <tr key={company.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                    {company.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {users.filter(user => user.companyId === company.id).length}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onClick={() => handleEditCompany(company)} className="text-blue-400 hover:text-blue-600 mr-4">Edit</button>
                    <button className="text-green-400 hover:text-green-600 mr-4">Activate/Deactivate</button>
                    <button onClick={() => handleDeleteCompany(company.id)} className="text-red-400 hover:text-red-600">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isCompanyEditModalOpen && editingCompany && (
        <CompanyEditModal
          company={editingCompany}
          onClose={handleCloseCompanyEditModal}
        />
      )}

      {/* Manage Users Section */}
      <div className="bg-gray-800 p-6 rounded-lg">
        <h2 className="text-xl font-bold mb-4">Manage Users</h2>
        <p className="text-gray-400 mb-4">
          Here you can view, create, edit, and delete users across all companies.
        </p>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Username
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Company
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Role
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {users.map((user) => (
                <tr key={user.username}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                    {user.username}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {companies.find(c => c.id === user.companyId)?.name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {user.role === 'superadmin' ? 'Super Admin' : user.role === 'admin' ? 'Admin' : 'User'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onClick={() => handleEditUser(user)} className="text-blue-400 hover:text-blue-600 mr-4">Edit</button>
                    <button className="text-red-400 hover:text-red-600">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button onClick={() => setIsCreateModalOpen(true)} className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white font-bold">
          Add New User
        </button>
      </div>

      {isEditModalOpen && editingUser && (
        <UserEditModal
          user={editingUser}
          onClose={handleCloseEditModal}
        />
      )}

      {isCreateModalOpen && (
        <UserCreateModal
          companies={companies}
          onClose={() => setIsCreateModalOpen(false)}
          onUserCreated={handleUserCreated}
        />
      )}
    </div>
  );
};

export default AdminDashboard;