import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

export const MainLayout = () => {
    return (
        <div className="min-h-screen bg-background font-sans antialiased flex">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
                <Header />
                <main className="container flex-1 py-6 pb-20 fade-in overflow-y-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};
