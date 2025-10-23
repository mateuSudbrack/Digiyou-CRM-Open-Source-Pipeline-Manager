import React from 'react';
import { Contact, Deal, DealStatus } from '../types';
import { PlusIcon, EditIcon, TrashIcon, BuildingOfficeIcon } from './icons';

interface ContactsViewProps {
  contacts: Contact[];
  deals: Deal[];
  onAddContact: () => void;
  onEditContact: (contact: Contact) => void;
  onDeleteContact: (contactId: string) => void;
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  filterBy: string;
  onFilterByChange: (filter: string) => void;
  filterValue: string;
  onFilterValueChange: (value: string) => void;
  selectedContactIds: string[];
  onSelectContact: (contactId: string, isSelected: boolean) => void;
  onSelectAllContacts: (isSelected: boolean) => void;
  onBulkDeleteContacts: () => void;
}

const ContactsView: React.FC<ContactsViewProps> = ({
  contacts,
  deals,
  onAddContact,
  onEditContact,
  onDeleteContact,
  searchTerm,
  onSearchTermChange,
  selectedContactIds,
  onSelectContact,
  onSelectAllContacts,
  onBulkDeleteContacts
}) => {
  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.phones.some(phone => phone.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const isAllSelected = filteredContacts.length > 0 && selectedContactIds.length === filteredContacts.length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 text-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Contacts</h1>
        <div className="flex space-x-2">
          {selectedContactIds.length > 0 && (
            <button
              onClick={onBulkDeleteContacts}
              className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
            >
              <TrashIcon className="h-5 w-5" />
              <span>Delete Selected ({selectedContactIds.length})</span>
            </button>
          )}
          <button
            onClick={onAddContact}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
          >
            <PlusIcon className="h-5 w-5" />
            <span>New Contact</span>
          </button>
        </div>
      </div>

      <input
        type="text"
        placeholder="Search contacts..."
        value={searchTerm}
        onChange={(e) => onSearchTermChange(e.target.value)}
        className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-4 mb-4 text-white"
      />

      <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-lg">
        <div className="p-4 flex items-center space-x-2">
          <input
            type="checkbox"
            checked={isAllSelected}
            onChange={(e) => onSelectAllContacts(e.target.checked)}
            className="form-checkbox h-5 w-5 text-blue-600"
          />
          <span className="text-white">Select All</span>
        </div>
        <ul className="divide-y divide-gray-700">
          {filteredContacts.map(contact => {
            const contactDeals = deals.filter(d => d.contactId === contact.id);
            const openDealsCount = contactDeals.filter(d => d.status === DealStatus.OPEN).length;
            const totalValue = contactDeals.reduce((sum, deal) => sum + deal.value, 0);

            return (
              <li key={contact.id} className="p-4 flex flex-col sm:flex-row items-center justify-between hover:bg-gray-700/50 transition-colors">
                <div className="flex items-center space-x-4 w-full sm:w-auto">
                  <input
                    type="checkbox"
                    checked={selectedContactIds.includes(contact.id)}
                    onChange={(e) => onSelectContact(contact.id, e.target.checked)}
                    className="form-checkbox h-5 w-5 text-blue-600"
                  />
                  <div className="bg-gray-700 p-3 rounded-full">
                    <BuildingOfficeIcon className="h-6 w-6 text-blue-400" />
                  </div>
                  <div>
                    <p className="font-bold text-lg">{contact.name}</p>
                    <p className="text-gray-400">{contact.email}</p>
                    <p className="text-gray-400 text-sm mt-1">{contact.phones.join(', ')}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-6 mt-4 sm:mt-0">
                    <div className="text-right">
                        <p className="font-semibold">{openDealsCount} open deal(s)</p>
                        <p className="text-gray-400 text-sm">Total Value: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValue)}</p>
                    </div>
                  <div className="flex space-x-2">
                    <button onClick={() => onEditContact(contact)} className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-gray-600" aria-label={`Edit ${contact.name}`}>
                      <EditIcon />
                    </button>
                    <button onClick={() => onDeleteContact(contact.id)} className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-600" aria-label={`Delete ${contact.name}`}>
                      <TrashIcon />
                    </button>
                  </div>
                </div>
              </li>
            );          })}
        </ul>
      </div>
    </div>
  );
};

export default ContactsView;