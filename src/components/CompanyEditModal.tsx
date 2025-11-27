import React, { useState, useEffect } from 'react';
import { Company } from '../types';
import { crmService } from '../services/crmService';
import Modal from './Modal';

interface CompanyEditModalProps {
  company: Company;
  onClose: () => void;
}

const CompanyEditModal: React.FC<CompanyEditModalProps> = ({ company, onClose }) => {
  const [companyName, setCompanyName] = useState(company.name);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    setCompanyName(company.name);
  }, [company]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      if (companyName === company.name) {
        setMessage('No changes to save.');
        return;
      }

      await crmService.updateCompany(company.id, { name: companyName });
      setMessage('Company updated successfully!');
      setTimeout(onClose, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to update company.');
    }
  };

  return (
    <Modal isOpen={true} title={`Edit Company: ${company.name}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
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

export default CompanyEditModal;