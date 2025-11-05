import React, { useState, useEffect, useCallback } from 'react';
import { produce } from 'immer';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import PipelineView from './components/PipelineView';
import DealsListView from './components/DealsListView';
import ContactsView from './components/ContactsView';
import SettingsView from './components/SettingsView';
import AutomationsView from './components/AutomationsView';
import AutomationBuilderView from './components/AutomationBuilderView';
import EmailTemplatesView from './components/EmailTemplatesView';
import EmailTemplateBuilder from './components/EmailTemplateBuilder';
import ApiView from './components/ApiView';
import CombinedCalendarView from './components/CombinedCalendarView';
import TodosView from './components/TodosView';
import ContactModal from './components/ContactModal';
import DealModal from './components/DealModal';
import StageModal from './components/StageModal';
import PipelineManagerModal from './components/PipelineManagerModal';
import ConfirmationModal from './components/ConfirmationModal';
import ImportDealsModal from './components/ImportDealsModal';
import Auth from './components/Login';
import ConfirmEmailView from './components/ConfirmEmailView';
import ResetPasswordView from './components/ResetPasswordView';
import TaskModal from './components/TaskModal';
import CalendarNoteModal from './components/CalendarNoteModal';
import ScheduleDealModal from './components/ScheduleDealModal';
import { crmService } from './services/crmService';
import { CrmData, Deal, Contact, Stage, DealImportData, Automation, Task, CalendarNote, User, DashboardWidget, EmailTemplate, DealImportPayload } from './types';

type View = 'dashboard' | 'pipeline' | 'deals' | 'contacts' | 'automations' | 'settings' | 'api' | 'calendar' | 'todos' | 'templates';
type CurrentUser = { username: string; companyId: string };

const App: React.FC = () => {
  const [view, setView] = useState<View>('dashboard');
  const [data, setData] = useState<CrmData | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState('');
  const [filterValue, setFilterValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [location, setLocation] = useState(window.location.pathname);

  // Modal states
  const [isDealModalOpen, setIsDealModalOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [defaultStageIdForDeal, setDefaultStageIdForDeal] = useState<string | undefined>(undefined);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isImportDealsModalOpen, setIsImportDealsModalOpen] = useState(false);
  const [editingAutomation, setEditingAutomation] = useState<Automation | 'new' | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | 'new' | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Partial<Task> | null>(null);
  const [isCalendarNoteModalOpen, setIsCalendarNoteModalOpen] = useState(false);
  const [selectedCalendarNote, setSelectedCalendarNote] = useState<CalendarNote | null>(null);
  const [isScheduleDealModalOpen, setIsScheduleDealModalOpen] = useState(false);
  const [dateForScheduling, setDateForScheduling] = useState<string | null>(null);
  const [currentDateForNewItem, setCurrentDateForNewItem] = useState<string | null>(null);
  const [contactCreationResolver, setContactCreationResolver] = useState<((contact: Contact | null) => void) | null>(null);


  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [selectedDealIds, setSelectedDealIds] = useState<string[]>([]);

  const handleSelectContact = (contactId: string, isSelected: boolean) => {
    setSelectedContactIds(prev =>
      isSelected ? [...prev, contactId] : prev.filter(id => id !== contactId)
    );
  };

  const handleSelectAllContacts = (isSelected: boolean) => {
    if (isSelected) {
      setSelectedContactIds(contacts.map(contact => contact.id));
    } else {
      setSelectedContactIds([]);
    }
  };



  // Management Modal states
  const [isPipelineManagerModalOpen, setIsPipelineManagerModalOpen] = useState(false);
  const [isStageModalOpen, setIsStageModalOpen] = useState(false);
  const [editingStage, setEditingStage] = useState<Stage | null>(null);
  const [currentPipelineIdForNewStage, setCurrentPipelineIdForNewStage] = useState<string | null>(null);

  // Confirmation Modal State
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [confirmationProps, setConfirmationProps] = useState({
      title: '',
      message: '',
      onConfirm: () => {},
  });

  const navigate = (path: string) => {
    if (window.location.pathname !== path) {
        window.history.pushState({}, '', path);
    }
    setLocation(path);
  };

  useEffect(() => {
    const handlePopState = () => {
      setLocation(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);
  
  useEffect(() => {
      const path = location.split('/')[1] || 'dashboard';
      if (['confirm-email', 'reset-password'].includes(path)) {
        return; // These are handled by the unauthenticated router
      }
      const viewMap: { [key: string]: View } = {
          '': 'dashboard',
          'dashboard': 'dashboard',
          'pipeline': 'pipeline',
          'deals': 'deals',
          'contacts': 'contacts',
          'automations': 'automations',
          'templates': 'templates',
          'settings': 'settings',
          'api': 'api',
          'calendar': 'calendar',
          'todos': 'todos',
      };
      setView(viewMap[path] || 'dashboard');
  }, [location]);

  useEffect(() => {
    if (!data || isDealModalOpen || isContactModalOpen) return;

    const parts = location.split('/');
    const mainView = parts[1];
    const entityId = parts[2];

    if (mainView === 'deals' && entityId) {
        const deal = data.deals.find(d => d.id === entityId);
        if (deal) {
            handleOpenDealModal(deal, { shouldNavigate: true }); 
        } else {
            navigate('/deals');
        }
    } else if (mainView === 'contacts' && entityId) {
        const contact = contacts.find(c => c.id === decodeURIComponent(entityId));
        if (contact) {
            handleOpenContactModal(contact, true); 
        } else {
            navigate('/contacts');
        }
    }
  }, [location, data, contacts]);


  const openConfirmationModal = (title: string, message: string, onConfirm: () => void) => {
      setConfirmationProps({ title, message, onConfirm });
      setIsConfirmationModalOpen(true);
  };
  
  const closeConfirmationModal = () => {
      setIsConfirmationModalOpen(false);
  };

  const handleConfirm = () => {
      confirmationProps.onConfirm();
      closeConfirmationModal();
  };


  const fetchData = useCallback(async () => {
    try {
      const crmData = await crmService.getAllData();
      setData(crmData);
    } catch (error) {
      console.error("Failed to fetch CRM data:", error);
    }
  }, []);

  const fetchContacts = useCallback(async () => {
    try {
      const fetchedContacts = await crmService.getContacts(searchTerm, filterBy, filterValue);
      setContacts(fetchedContacts);
    } catch (error) {
      console.error("Failed to fetch contacts:", error);
    }
  }, [searchTerm, filterBy, filterValue]);

  useEffect(() => {
    if (currentUser) {
        console.log("Fetching data...");
        setIsLoading(true);
        fetchData().finally(() => setIsLoading(false));
    }
  }, [fetchData, currentUser]);

  useEffect(() => {
    if (currentUser) {
        console.log("Fetching contacts...");
        fetchContacts();
    }
  }, [fetchContacts, currentUser]);

  const handleAuthSuccess = (user: CurrentUser) => {
    crmService.setCompanyId(user.companyId);
    setCurrentUser(user);
  };

  const handleLogout = async () => {
    await crmService.logout();
    localStorage.removeItem('currentUser');
    crmService.setCompanyId(null);
    setCurrentUser(null);
    setData(null); // Clear data on logout
    navigate('/dashboard');
  };

  useEffect(() => {
    const verifySession = async () => {
      try {
        const user = await crmService.checkSession();
        if (user) {
          handleAuthSuccess(user);
        } else {
          handleLogout();
        }
      } catch (error) {
        handleLogout();
      }
    };
    verifySession();
  }, []);

  const optimisticallyUpdateDeal = (dealId: string, updates: Partial<Deal>) => {
    setData(
        produce((draft: CrmData | null) => {
            if (!draft) return;
            const dealIndex = draft.deals.findIndex(d => d.id === dealId);
            if (dealIndex !== -1) {
                const originalDeal = draft.deals[dealIndex];
                draft.deals[dealIndex] = { ...originalDeal, ...updates, updatedAt: new Date().toISOString() };
            }
        })
    );
  };


  // --- Handlers for Deal Modal ---
  const handleOpenDealModal = (deal: Deal | null, options: { shouldNavigate?: boolean, defaultStageId?: string } = {}) => {
    const { shouldNavigate = true, defaultStageId } = options;
    setSelectedDeal(deal);
    setDefaultStageIdForDeal(defaultStageId);
    setIsDealModalOpen(true);
    if (deal && shouldNavigate) {
        navigate(`/deals/${deal.id}`);
    }
  };
  
  const handleCloseDealModal = () => {
    if (location.startsWith('/deals/')) {
        const baseView = location.split('/')[1];
        if (baseView === 'pipeline' || baseView === 'contacts') {
             navigate(`/${baseView}`);
        } else {
            navigate('/deals');
        }
    }
    setIsDealModalOpen(false);
    setSelectedDeal(null);
    setCurrentDateForNewItem(null);
    setDefaultStageIdForDeal(undefined);
  };
  
  const handleSaveDeal = async (dealData: Omit<Deal, 'id' | 'createdAt' | 'updatedAt' | 'history' | 'companyId'> | Deal) => {
    if ('id' in dealData) {
      await crmService.updateDeal(dealData.id, dealData);
    } else {
      await crmService.createDeal(dealData);
    }
    await fetchData();
    handleCloseDealModal();
  };
  
  const handleDeleteDeal = async (dealId: string) => {
      openConfirmationModal(
          'Delete Deal',
          'Are you sure you want to permanently delete this deal?',
          async () => {
              await crmService.deleteDeal(dealId);
              await fetchData();
              handleCloseDealModal();
          }
      );
  };

  // --- Handlers for Contact Modal ---
  const handleOpenContactModal = (contact: Contact | null, shouldNavigate = true) => {
    setSelectedContact(contact);
    setIsContactModalOpen(true);
    if (contact && shouldNavigate) {
        navigate(`/contacts/${encodeURIComponent(contact.id)}`);
    }
  };
  
  const handleCloseContactModal = () => {
    if (location.startsWith('/contacts/')) {
        navigate('/contacts');
    }
    if (contactCreationResolver) {
      contactCreationResolver(null);
      setContactCreationResolver(null);
    }
    setIsContactModalOpen(false);
    setSelectedContact(null);
  };

  const handleSaveContact = async (contactData: Omit<Contact, 'id' | 'history' | 'companyId'> | Contact): Promise<{ success: boolean; message?: string; contact?: Contact; }> => {
    try {
        let savedContact: Contact;
        if ('id' in contactData) {
          savedContact = await crmService.updateContact(contactData.id, contactData);
        } else {
          savedContact = await crmService.createContact(contactData, currentUser.companyId);
        }
        await fetchContacts();
        if (contactCreationResolver) {
          contactCreationResolver(savedContact);
          setContactCreationResolver(null);
        }
        handleCloseContactModal();
        return { success: true, contact: savedContact };
    } catch (error: any) {
        console.error("Failed to save contact:", error);
        if (contactCreationResolver) {
          contactCreationResolver(null);
          setContactCreationResolver(null);
        }
        return { success: false, message: error.message };
    }
  };
  
  const handleDeleteContact = async (contactId: string) => {
    openConfirmationModal(
        'Delete Contact',
        'Are you sure you want to delete this contact and all their deals? This action cannot be undone.',
        async () => {
            await crmService.deleteContact(contactId);
            await fetchContacts();
            setSelectedContactIds(prev => prev.filter(id => id !== contactId));
        }
    );
  };

  const handleBulkDeleteContacts = async () => {
    openConfirmationModal(
      'Delete Selected Contacts',
      `Are you sure you want to delete ${selectedContactIds.length} selected contacts and all their deals? This action cannot be undone.`,
      async () => {
        await Promise.all(selectedContactIds.map(contactId => crmService.deleteContact(contactId)));
        await fetchContacts();
        setSelectedContactIds([]);
      }
    );
  };



  const handleDealClickFromContactModal = (deal: Deal) => {
    handleCloseContactModal();
    setTimeout(() => {
        handleOpenDealModal(deal, { shouldNavigate: false }); // Don't navigate as we are inside another modal
    }, 150); // Timeout to allow smooth transition
  };

  const handleAddNewContact = (): Promise<Contact | null> => {
    return new Promise((resolve) => {
      setContactCreationResolver(() => resolve);
      handleOpenContactModal(null, false);
    });
  };
  


  // --- Handlers for Stage Management ---
  const handleOpenStageManagerForPipeline = (pipelineId: string) => {
      setCurrentPipelineIdForNewStage(pipelineId);
      setEditingStage(null); // Clear previous editing stage
      setIsStageModalOpen(true);
  }
  
  const handleEditStage = (stage: Stage) => {
    setCurrentPipelineIdForNewStage(null); // Clear pipelineId for new stage
    setEditingStage(stage);
    setIsStageModalOpen(true);
  };

  const handleCloseStageModal = () => {
    setIsStageModalOpen(false);
    setEditingStage(null);
    setCurrentPipelineIdForNewStage(null);
  };

  const handleDeleteStage = async (stageId: string) => {
    openConfirmationModal(
        'Delete Stage',
        'Are you sure you want to delete this stage? Deals in this stage will be moved to the first available stage of the pipeline.',
        async () => {
            await crmService.deleteStage(stageId);
            await fetchData();
        }
    );
  };

  // --- Handlers for Pipeline Management ---
  const handleDeletePipeline = async (pipelineId: string) => {
    openConfirmationModal(
        'Delete Pipeline',
        'Are you sure? This will delete the pipeline and all its stages and deals.',
        async () => {
            await crmService.deletePipeline(pipelineId);
            await fetchData();
        }
    );
  }

  // --- Handlers for Import ---
  const handleImportDeals = async (payload: DealImportPayload) => {
      const result = await crmService.importDeals(payload);
      await fetchData();
      return result;
  };
  
  // --- Handlers for Automations ---
  const handleOpenAutomationBuilder = (automation: Automation | null) => {
      setEditingAutomation(automation || 'new');
  };
  
  const handleCloseAutomationBuilder = () => {
      setEditingAutomation(null);
  };
  
  const handleSaveAutomation = async (automationData: Omit<Automation, 'id' | 'companyId'> | Automation) => {
      if ('id' in automationData) {
          await crmService.updateAutomation(automationData.id, automationData);
      } else {
          await crmService.createAutomation(automationData);
      }
      await fetchData();
      handleCloseAutomationBuilder();
  };

  const handleDeleteAutomation = async (automationId: string) => {
      openConfirmationModal(
          'Delete Automation',
          'Are you sure you want to permanently delete this automation?',
          async () => {
              await crmService.deleteAutomation(automationId);
              await fetchData();
          }
      );
  };

  // --- Handlers for Email Templates ---
  const handleOpenTemplateBuilder = (template: EmailTemplate | null) => {
    setEditingTemplate(template || 'new');
  };

  const handleCloseTemplateBuilder = () => {
    setEditingTemplate(null);
  };

  const handleSaveTemplate = async (templateData: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt' | 'companyId'> | EmailTemplate) => {
    let savedTemplate;
    if ('id' in templateData) {
      savedTemplate = await crmService.updateEmailTemplate(templateData.id, templateData);
    } else {
      savedTemplate = await crmService.createEmailTemplate(templateData);
    }
    setEditingTemplate(savedTemplate);
    await fetchData();
  };

  const handleDeleteTemplate = (templateId: string) => {
    openConfirmationModal(
      'Delete Email Template',
      'Are you sure you want to delete this template? It will be removed from any automations using it.',
      async () => {
        await crmService.deleteEmailTemplate(templateId);
        await fetchData();
      }
    );
  };


  const handleDeleteCustomField = (fieldId: string) => {
    openConfirmationModal(
        'Delete Deal Custom Field',
        'Are you sure you want to delete this custom field? It will be removed from all deals.',
        async () => {
            await crmService.deleteCustomFieldDefinition(fieldId);
            await fetchData();
        }
    );
  };

  const handleDeleteContactCustomField = (fieldId: string) => {
    openConfirmationModal(
        'Delete Contact Custom Field',
        'Are you sure you want to delete this custom field? It will be removed from all contacts.',
        async () => {
            await crmService.deleteContactCustomFieldDefinition(fieldId);
            await fetchData();
        }
    );
  };


  // --- Task Handlers ---
  const handleOpenTaskModal = (task: Partial<Task> | null) => {
      setSelectedTask(task);
      setIsTaskModalOpen(true);
  };
  const handleCloseTaskModal = () => {
      setSelectedTask(null);
      setIsTaskModalOpen(false);
      setCurrentDateForNewItem(null);
  };
  const handleSaveTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'isCompleted' | 'companyId'> | Task) => {
      if ('id' in taskData) {
          await crmService.updateTask(taskData.id, taskData);
      } else {
          await crmService.createTask(taskData as Omit<Task, 'id' | 'createdAt' | 'isCompleted' | 'companyId'>);
      }
      await fetchData();
      handleCloseTaskModal();
  };
  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
      await crmService.updateTask(taskId, updates);
      await fetchData();
  };
  const handleDeleteTask = async (taskId: string) => {
      await crmService.deleteTask(taskId);
      await fetchData();
  };

  // --- Calendar Note Handlers ---
  const handleOpenCalendarNoteModal = (note: CalendarNote | null) => {
    setSelectedCalendarNote(note);
    setIsCalendarNoteModalOpen(true);
  };
  const handleCloseCalendarNoteModal = () => {
    setSelectedCalendarNote(null);
    setIsCalendarNoteModalOpen(false);
    setCurrentDateForNewItem(null);
  };
  const handleSaveCalendarNote = async (noteData: Omit<CalendarNote, 'id' | 'createdAt' | 'companyId'> | CalendarNote) => {
    if ('id' in noteData) {
        await crmService.updateCalendarNote(noteData.id, noteData);
    } else {
        await crmService.createCalendarNote(noteData);
    }
    await fetchData();
    handleCloseCalendarNoteModal();
  };
  const handleDeleteCalendarNote = async (noteId: string) => {
    await crmService.deleteCalendarNote(noteId);
    await fetchData();
    handleCloseCalendarNoteModal();
  };
  
  // --- Calendar Add Handlers ---
  const handleAddNewItemOnDate = (date: string, itemType: 'deal' | 'task' | 'note') => {
      setCurrentDateForNewItem(date);
      if (itemType === 'deal') handleOpenDealModal(null, { shouldNavigate: false });
      if (itemType === 'task') handleOpenTaskModal(null);
      if (itemType === 'note') handleOpenCalendarNoteModal(null);
  }
  
  const handleOpenScheduleDealModal = (date: string) => {
    setDateForScheduling(date);
    setIsScheduleDealModalOpen(true);
  };
  const handleCloseScheduleDealModal = () => {
    setDateForScheduling(null);
    setIsScheduleDealModalOpen(false);
  };
  const handleScheduleDeal = async (dealId: string) => {
    if (dateForScheduling) {
        await crmService.updateDeal(dealId, { data_vencimento: dateForScheduling });
        await fetchData();
        handleCloseScheduleDealModal();
    }
  };
  
  // --- User Management Handlers ---
  const handleDeleteUser = async (username: string) => {
    if (currentUser?.username.toLowerCase() === username.toLowerCase()) {
      alert("You cannot delete your own account.");
      return;
    }
    openConfirmationModal(
      'Delete User',
      `Are you sure you want to permanently delete the user "${username}"? This action cannot be undone.`,
      async () => {
        try {
          await crmService.deleteUser(username, currentUser.companyId);
          await fetchData();
        } catch (error: any) {
          alert(`Failed to delete user: ${error.message}`);
        }
      }
    );
  };

  const handleAddTaskForDeal = (dealId: string) => {
    handleOpenTaskModal({ dealId: dealId });
  };

  // --- Dashboard Handlers ---
  const handleSaveDashboardConfig = async (config: DashboardWidget[]) => {
    await crmService.updateDashboardConfig(currentUser.companyId, config);
  };


  const renderContent = () => {
    if (isLoading || !data) {
      return <div className="flex justify-center items-center h-screen"><p className="text-white text-xl">Loading CRM...</p></div>;
    }

    if (editingAutomation) {
        const automationToEdit = typeof editingAutomation === 'object' ? editingAutomation : null;
        return (
             <AutomationBuilderView 
                onSave={handleSaveAutomation}
                onBack={handleCloseAutomationBuilder}
                automation={automationToEdit}
                pipelines={data.pipelines}
                stages={data.stages}
                customFieldDefinitions={data.customFieldDefinitions}
                emailTemplates={data.emailTemplates}
            />
        );
    }

    if (editingTemplate) {
      const templateToEdit = typeof editingTemplate === 'object' ? editingTemplate : null;
      return (
        <EmailTemplateBuilder
          key={templateToEdit ? templateToEdit.updatedAt : 'new'}
          onSave={handleSaveTemplate}
          onBack={handleCloseTemplateBuilder}
          template={templateToEdit}
          customFieldDefinitions={data.customFieldDefinitions}
          contactCustomFieldDefinitions={data.contactCustomFieldDefinitions}
        />
      );
    }
    
    switch (view) {
      case 'dashboard':
        return <Dashboard data={data} onSaveLayout={handleSaveDashboardConfig} />;
      case 'pipeline':
        return <PipelineView 
                    data={data} 
                    refreshData={fetchData} 
                    onDealClick={(deal) => handleOpenDealModal(deal, { shouldNavigate: false })} 
                    onAddNewDeal={(stageId) => handleOpenDealModal(null, { shouldNavigate: false, defaultStageId: stageId })}
                    onManagePipelines={() => setIsPipelineManagerModalOpen(true)}
                    onAddNewStage={handleOpenStageManagerForPipeline}
                    onEditStage={handleEditStage}
                    onDeleteStage={handleDeleteStage}
                    optimisticallyUpdateDeal={optimisticallyUpdateDeal}
                />;
       case 'deals':
        return <DealsListView 
                    deals={data.deals} 
                    contacts={contacts} 
                    stages={data.stages}
                    pipelines={data.pipelines}
                    customFieldDefinitions={data.customFieldDefinitions}
                    onEditDeal={handleOpenDealModal} 
                    onDeleteDeal={handleDeleteDeal} 
                    onAddDeal={() => handleOpenDealModal(null)} 
                    onImportDeals={() => setIsImportDealsModalOpen(true)} 


                    scheduledJobs={data.scheduledJobs}
                />;
      case 'contacts':
        return <ContactsView 
                    contacts={contacts} 
                    deals={data.deals} 
                    onAddContact={() => handleOpenContactModal(null)} 
                    onEditContact={handleOpenContactModal} 
                    onDeleteContact={handleDeleteContact}
                    searchTerm={searchTerm}
                    onSearchTermChange={setSearchTerm}
                    filterBy={filterBy}
                    onFilterByChange={setFilterBy}
                    filterValue={filterValue}
                    onFilterValueChange={setFilterValue}
                    selectedContactIds={selectedContactIds}
                    onSelectContact={handleSelectContact}
                    onSelectAllContacts={handleSelectAllContacts}
                    onBulkDeleteContacts={handleBulkDeleteContacts}
                />;
      case 'automations':
        return <AutomationsView data={data} onAddAutomation={() => handleOpenAutomationBuilder(null)} onEditAutomation={handleOpenAutomationBuilder} onDeleteAutomation={handleDeleteAutomation} />;
      case 'templates':
        return <EmailTemplatesView templates={data.emailTemplates} onAddTemplate={() => handleOpenTemplateBuilder(null)} onEditTemplate={handleOpenTemplateBuilder} onDeleteTemplate={handleDeleteTemplate} />;
      case 'calendar':
        return <CombinedCalendarView 
                    deals={data.deals}
                    tasks={data.tasks}
                    notes={data.calendarNotes}
                    onDealClick={(deal) => handleOpenDealModal(deal, { shouldNavigate: false })}
                    onTaskClick={(task) => handleOpenTaskModal(task)}
                    onNoteClick={handleOpenCalendarNoteModal}
                    onAddNewItem={handleAddNewItemOnDate}
                    onScheduleExistingDeal={handleOpenScheduleDealModal}
                />;
      case 'todos':
        return <TodosView tasks={data.tasks} onAddTask={() => handleOpenTaskModal(null)} onUpdateTask={handleUpdateTask} onDeleteTask={handleDeleteTask} onEditTask={(task) => handleOpenTaskModal(task)} />;
      case 'settings':
        return <SettingsView data={data} refreshData={fetchData} onManagePipelines={() => setIsPipelineManagerModalOpen(true)} onManageStages={handleOpenStageManagerForPipeline} onDeleteCustomField={handleDeleteCustomField} onDeleteContactCustomField={handleDeleteContactCustomField} onDeleteUser={handleDeleteUser}/>;
      case 'api':
        return <ApiView data={data} refreshData={fetchData} companyId={currentUser.companyId} />;
      default:
        return <Dashboard data={data} onSaveLayout={handleSaveDashboardConfig} />;
    }
  };

  if (!currentUser) {
    const parts = location.split('/');
    if (parts[1] === 'confirm-email' && parts[2]) {
      return <ConfirmEmailView token={parts[2]} navigate={navigate} />;
    }
    if (parts[1] === 'reset-password' && parts[2]) {
      return <ResetPasswordView token={parts[2]} navigate={navigate} />;
    }
    return <Auth onAuthSuccess={handleAuthSuccess} />;
  }

  const pipelineIdForStageModal = currentPipelineIdForNewStage || editingStage?.pipelineId;
  const stagesForModal = (data && pipelineIdForStageModal)
    ? data.stages.filter(s => s.pipelineId === pipelineIdForStageModal).sort((a, b) => a.order - b.order)
    : [];

  return (
    <div className="min-h-screen bg-gray-900">
      <Header currentPath={location} navigate={navigate} onLogout={handleLogout} />
      <main>
        {renderContent()}
      </main>
      
      {data && !editingAutomation && !editingTemplate && (
        <>
            <DealModal 
                isOpen={isDealModalOpen}
                onClose={handleCloseDealModal}
                onSave={handleSaveDeal}
                onDelete={handleDeleteDeal}
                deal={selectedDeal}
                contacts={contacts}
                pipelines={data.pipelines}
                stages={data.stages}
                customFieldDefs={data.customFieldDefinitions}
                tasks={data.tasks}
                defaultDataVencimento={currentDateForNewItem || undefined}
                defaultStageId={defaultStageIdForDeal}
                onAddNewContact={handleAddNewContact}
                onAddTaskForDeal={handleAddTaskForDeal}
                onUpdateTask={handleUpdateTask}
            />
            <ContactModal
                isOpen={isContactModalOpen}
                onClose={handleCloseContactModal}
                onSave={handleSaveContact}
                contact={selectedContact}
                customFieldDefs={data.contactCustomFieldDefinitions}
                deals={data.deals}
                stages={data.stages}
                tasks={data.tasks}
                onDealClick={handleDealClickFromContactModal}
                onAddTaskForContact={(contactId) => handleOpenTaskModal({ contactId: contactId })}
                scheduledJobs={data.scheduledJobs}
            />
            <StageModal
                isOpen={isStageModalOpen}
                onClose={handleCloseStageModal}
                pipelineId={pipelineIdForStageModal}
                stages={stagesForModal}
                refreshData={fetchData}
                onDeleteStage={handleDeleteStage}
            />
            <PipelineManagerModal
                isOpen={isPipelineManagerModalOpen}
                onClose={() => setIsPipelineManagerModalOpen(false)}
                pipelines={data.pipelines}
                refreshData={fetchData}
                onDeletePipeline={handleDeletePipeline}
            />
             <ImportDealsModal
                isOpen={isImportDealsModalOpen}
                onClose={() => setIsImportDealsModalOpen(false)}
                onImport={handleImportDeals}
                customFieldDefs={data.customFieldDefinitions}
                contactCustomFieldDefs={data.contactCustomFieldDefinitions}
                pipelines={data.pipelines}
                stages={data.stages}
            />
            <TaskModal
                isOpen={isTaskModalOpen}
                onClose={handleCloseTaskModal}
                onSave={handleSaveTask}
                task={selectedTask}
                contacts={contacts}
                deals={data.deals}
                defaultDate={currentDateForNewItem || undefined}
            />
            <CalendarNoteModal
                isOpen={isCalendarNoteModalOpen}
                onClose={handleCloseCalendarNoteModal}
                onSave={handleSaveCalendarNote}
                onDelete={handleDeleteCalendarNote}
                note={selectedCalendarNote}
                defaultDate={currentDateForNewItem || undefined}
            />
            <ScheduleDealModal
                isOpen={isScheduleDealModalOpen}
                onClose={handleCloseScheduleDealModal}
                onSchedule={handleScheduleDeal}
                deals={data.deals.filter(d => !d.data_vencimento)}
                date={dateForScheduling}
            />
        </>
      )}
      <ConfirmationModal
        isOpen={isConfirmationModalOpen}
        onClose={closeConfirmationModal}
        onConfirm={handleConfirm}
        title={confirmationProps.title}
      >
        <p>{confirmationProps.message}</p>
      </ConfirmationModal>
    </div>
  );
};

export default App;