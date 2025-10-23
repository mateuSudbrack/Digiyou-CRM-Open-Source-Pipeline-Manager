import React, { useState, useRef, useEffect } from 'react';
import { ChartBarIcon, TableCellsIcon, BuildingOfficeIcon, Cog6ToothIcon, ListBulletIcon, BoltIcon, CodeBracketIcon, PlusIcon, CalendarDaysIcon, CheckCircleIcon, ClipboardDocumentListIcon } from './icons';

interface HeaderProps {
    currentPath: string;
    navigate: (path: string) => void;
    onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentPath, navigate, onLogout }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const navItemClasses = "flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium cursor-pointer transition-colors";
    const activeClasses = "bg-gray-700 text-white";
    const inactiveClasses = "text-gray-300 hover:bg-gray-700 hover:text-white";
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [dropdownRef]);
    
    const handleNavigation = (path: string) => {
        navigate(path);
        setIsDropdownOpen(false);
    };

    const isActive = (path: string, exact: boolean = false) => {
        if (exact) {
             return currentPath === path || (path === '/dashboard' && currentPath === '/');
        }
        return currentPath.startsWith(path);
    };

    const isMenuMoreActive = ['/calendar', '/todos', '/templates', '/settings', '/api'].some(path => isActive(path));

    return (
        <header className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <h1 className="text-2xl font-bold text-white">
                                DigiYou<span className="text-blue-400">CRM</span>
                            </h1>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <nav className="flex space-x-4">
                            <div 
                                onClick={() => handleNavigation('/dashboard')} 
                                className={`${navItemClasses} ${isActive('/dashboard', true) ? activeClasses : inactiveClasses}`}
                            >
                                <ChartBarIcon className="h-5 w-5"/>
                                <span>Dashboard</span>
                            </div>
                            <div 
                                onClick={() => handleNavigation('/pipeline')} 
                                className={`${navItemClasses} ${isActive('/pipeline') ? activeClasses : inactiveClasses}`}
                            >
                                <TableCellsIcon className="h-5 w-5"/>
                                <span>Pipeline</span>
                            </div>
                            <div 
                                onClick={() => handleNavigation('/deals')} 
                                className={`${navItemClasses} ${isActive('/deals') ? activeClasses : inactiveClasses}`}
                            >
                                <ListBulletIcon className="h-5 w-5"/>
                                <span>Deals</span>
                            </div>
                             <div 
                                onClick={() => handleNavigation('/contacts')} 
                                className={`${navItemClasses} ${isActive('/contacts') ? activeClasses : inactiveClasses}`}
                            >
                                <BuildingOfficeIcon className="h-5 w-5"/>
                                <span>Contacts</span>
                            </div>
                            <div 
                                onClick={() => handleNavigation('/automations')} 
                                className={`${navItemClasses} ${isActive('/automations') ? activeClasses : inactiveClasses}`}
                            >
                                <BoltIcon className="h-5 w-5"/>
                                <span>Automations</span>
                            </div>
                        </nav>
                        
                        <div className="relative" ref={dropdownRef}>
                             <div onClick={() => setIsDropdownOpen(!isDropdownOpen)} className={`${navItemClasses} ${isMenuMoreActive ? activeClasses : inactiveClasses}`}>
                                <PlusIcon className="h-5 w-5"/>
                            </div>
                            {isDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-56 bg-gray-800 border border-gray-700 rounded-md shadow-lg py-1 z-50">
                                    <div onClick={() => handleNavigation('/templates')} className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 cursor-pointer">
                                        <ClipboardDocumentListIcon className="h-5 w-5" />
                                        <span>Templates</span>
                                    </div>
                                    <div onClick={() => handleNavigation('/calendar')} className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 cursor-pointer">
                                        <CalendarDaysIcon className="h-5 w-5" />
                                        <span>Calendar</span>
                                    </div>
                                    <div onClick={() => handleNavigation('/todos')} className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 cursor-pointer">
                                        <CheckCircleIcon className="h-5 w-5" />
                                        <span>Tasks</span>
                                    </div>
                                    <div className="border-t border-gray-700 my-1"></div>
                                    <div onClick={() => handleNavigation('/settings')} className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 cursor-pointer">
                                        <Cog6ToothIcon className="h-5 w-5" />
                                        <span>Settings</span>
                                    </div>
                                    <div onClick={() => handleNavigation('/api')} className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 cursor-pointer">
                                        <CodeBracketIcon className="h-5 w-5" />
                                        <span>API</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="pl-4 ml-4 border-l border-gray-700">
                             <button
                                onClick={onLogout}
                                className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium cursor-pointer transition-colors text-red-400 hover:bg-red-500/10 hover:text-red-300"
                            >
                                <span>Logout</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;