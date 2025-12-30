import { Outlet } from 'react-router-dom';
import { Header } from './Header';

export const MainLayout = () => {
    return (
        <div className="min-h-screen bg-background font-sans antialiased">
            <Header />
            <main className="container py-6 pb-20 fade-in">
                <Outlet />
            </main>
        </div>
    );
};
