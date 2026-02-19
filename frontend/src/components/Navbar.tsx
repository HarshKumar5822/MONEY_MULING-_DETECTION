import { Link, useLocation } from 'react-router-dom';
import { Shield, LayoutDashboard, FileText, Split, Menu, BarChart2, Settings } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useMuleContext } from '@/context/MuleContext';

export function Navbar() {
    const location = useLocation();
    const { fileName, isMockMode } = useMuleContext();
    const [isOpen, setIsOpen] = useState(false);

    const navs = [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard },
        { name: 'Transactions', path: '/transactions', icon: FileText },
        { name: 'Analytics', path: '/analytics', icon: BarChart2 },
        { name: 'Patterns', path: '/patterns', icon: Split },
    ];

    return (
        <header className="sticky top-0 z-50 w-full border-b border-border bg-card/80 backdrop-blur-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">

                {/* Brand */}
                <Link to="/" className="flex items-center gap-2.5 flex-shrink-0 group">
                    <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-blue group-hover:scale-105 transition-transform">
                        <Shield className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div className="leading-tight">
                        <span className="font-bold text-foreground text-sm tracking-tight block">MuleGuard</span>
                        <span className="font-light text-muted-foreground text-xs block">Forensics Engine</span>
                    </div>
                </Link>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-1">
                    {navs.map(item => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;

                        return (
                            <motion.div
                                key={item.path}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <Link
                                    to={item.path}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all group ${isActive
                                        ? 'bg-primary/10 text-primary'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                                        }`}
                                >
                                    <Icon className={`w-4 h-4 transition-transform group-hover:rotate-12 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                                    {item.name}
                                </Link>
                            </motion.div>
                        );
                    })}
                </nav>

                {/* Right Info */}
                <div className="flex items-center gap-3">
                    <Link
                        to="/settings"
                        className={`p-2 rounded-lg transition-colors ${location.pathname === '/settings'
                            ? 'bg-muted text-foreground'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                            }`}
                    >
                        <Settings className="w-5 h-5" />
                    </Link>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden p-2 text-muted-foreground hover:text-foreground"
                        onClick={() => setIsOpen(!isOpen)}
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                </div>
            </div>

            {/* Mobile Nav Dropdown */}
            {isOpen && (
                <div className="md:hidden border-t border-border bg-card px-4 py-4 space-y-2 relative shadow-lg">
                    {navs.map(item => (
                        <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => setIsOpen(false)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${location.pathname === item.path
                                ? 'bg-primary/10 text-primary'
                                : 'text-muted-foreground hover:bg-muted'
                                }`}
                        >
                            <item.icon className="w-5 h-5" />
                            {item.name}
                        </Link>
                    ))}
                </div>
            )}
        </header>
    );
}
