import { useState, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaStore, FaGraduationCap, FaChalkboardTeacher, FaRobot, FaGripVertical, FaGripHorizontal } from 'react-icons/fa';
import AuthContext from '../../context/AuthContext';

const AppSidebar = ({ children }) => {
    const { user } = useContext(AuthContext);
    const location = useLocation();
    const currentPath = location.pathname;

    const [tabLayout, setTabLayout] = useState(() => {
        return localStorage.getItem('appSidebarLayout') || 'vertical';
    });
    const toggleTabLayout = () => {
        const next = tabLayout === 'vertical' ? 'horizontal' : 'vertical';
        setTabLayout(next);
        localStorage.setItem('appSidebarLayout', next);
    };

    // Don't show sidebar on auth pages, lecture view, invoice, or for non-logged-in users
    const hideSidebarPaths = ['/login', '/register', '/invoice'];
    const shouldHide = !user
        || hideSidebarPaths.some(p => currentPath.startsWith(p))
        || currentPath.match(/\/course\/[^/]+\/lecture\//);

    if (shouldHide) {
        return <>{children}</>;
    }

    // Build nav items
    const navItems = [
        { path: '/marketplace', label: 'Market', fullLabel: 'Marketplace', icon: FaStore, match: (p) => p === '/marketplace' || p.startsWith('/marketplace/') },
        { path: '/my-learning', label: 'Learning', fullLabel: 'My Learning', icon: FaGraduationCap, match: (p) => p === '/my-learning' || p.startsWith('/course/') },
        { path: '/my-courses', label: 'Courses', fullLabel: 'My Courses', icon: FaChalkboardTeacher, match: (p) => p === '/my-courses' || p.startsWith('/admin/course/') },
    ];

    // Mark active
    const itemsWithActive = navItems.map(item => ({
        ...item,
        active: item.match(currentPath),
    }));

    // AI Chat active state
    const isAIChatActive = currentPath === '/ai-chat' || currentPath === '/ai-settings';

    return (
        <>
            {/* Horizontal Tabs */}
            {tabLayout === 'horizontal' && (
                <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 sticky top-16 z-10">
                    <div className="container mx-auto px-4">
                        <div className="flex items-center gap-1">
                            <div className="flex flex-1 gap-1 overflow-x-auto scrollbar-hide">
                                {itemsWithActive.map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <Link
                                            key={item.path}
                                            to={item.path}
                                            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${item.active
                                                ? 'border-slate-900 text-slate-900 dark:text-white dark:border-white'
                                                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                                }`}
                                        >
                                            <Icon className="text-sm" />
                                            <span>{item.fullLabel}</span>
                                        </Link>
                                    );
                                })}
                                <Link
                                    to="/ai-chat"
                                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${isAIChatActive
                                        ? 'border-slate-900 text-slate-900 dark:text-white dark:border-white'
                                        : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                        }`}
                                >
                                    <FaRobot className="text-sm" />
                                    <span>AI Chat</span>
                                </Link>
                            </div>
                            <button
                                onClick={toggleTabLayout}
                                className="p-1.5 ml-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded transition-colors shrink-0"
                                title="Switch to vertical sidebar"
                            >
                                <FaGripVertical size={12} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Mobile bottom nav */}
            {tabLayout === 'vertical' && (
                <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 safe-area-bottom">
                    <div className="flex items-stretch">
                        {itemsWithActive.map((item) => {
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`relative flex-1 flex flex-col items-center gap-0.5 py-2 pt-2.5 transition-colors ${item.active ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`}
                                >
                                    {item.active && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full" />}
                                    <Icon className="text-[17px]" />
                                    <span className="text-[9px] font-semibold leading-tight">{item.label}</span>
                                </Link>
                            );
                        })}
                        <Link
                            to="/ai-chat"
                            className={`relative flex-1 flex flex-col items-center gap-0.5 py-2 pt-2.5 transition-colors ${isAIChatActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`}
                        >
                            {isAIChatActive && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full" />}
                            <FaRobot className="text-[17px]" />
                            <span className="text-[9px] font-semibold leading-tight">AI Chat</span>
                        </Link>
                    </div>
                </div>
            )}

            {/* Vertical Sidebar (desktop) */}
            {tabLayout === 'vertical' && (
                <div className="hidden md:flex fixed left-0 top-16 bottom-0 w-[85px] z-20 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 flex-col items-center pt-4 pb-4">
                    <div className="flex flex-col items-center gap-1 flex-1">
                        {itemsWithActive.map((item) => {
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`relative w-[70px] flex flex-col items-center gap-1.5 px-1 py-3 rounded-xl transition-all ${item.active
                                        ? 'bg-blue-600 text-white shadow-md shadow-blue-200 dark:shadow-blue-900/40'
                                        : 'text-slate-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'
                                        }`}
                                >
                                    <Icon className="text-[18px]" />
                                    <span className="text-[10px] font-semibold leading-tight">{item.label}</span>
                                </Link>
                            );
                        })}
                    </div>
                    <Link
                        to="/ai-chat"
                        className={`w-[70px] flex flex-col items-center gap-1.5 px-1 py-3 rounded-xl transition-all ${isAIChatActive
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-200 dark:shadow-blue-900/40'
                            : 'text-slate-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'
                            }`}
                        title="AI Chat Assistant"
                    >
                        <FaRobot className="text-[18px]" />
                        <span className="text-[10px] font-semibold leading-tight">AI Chat</span>
                    </Link>
                    <button
                        onClick={toggleTabLayout}
                        className="w-[70px] flex flex-col items-center gap-1 px-1 py-2.5 text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                        title="Switch to horizontal tabs"
                    >
                        <FaGripHorizontal className="text-sm" />
                        <span className="text-[9px] font-medium">Layout</span>
                    </button>
                </div>
            )}

            {/* Page Content */}
            <div className={tabLayout === 'vertical' ? 'pb-20 md:pb-0 md:pl-[85px]' : ''}>
                {children}
            </div>
        </>
    );
};

export default AppSidebar;
