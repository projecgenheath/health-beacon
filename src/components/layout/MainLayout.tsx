import { Outlet } from 'react-router-dom';
import { Header } from './Header';

export const MainLayout = () => {
    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main
                className="flex-1 py-4 sm:py-6 px-3 sm:px-4 md:px-6 lg:px-8 w-full max-w-[1920px] mx-auto pb-6"
                role="main"
            >
                <Outlet />
            </main>
        </div>
    );
};
