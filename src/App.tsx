import { Suspense, lazy, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { MainLayout } from "@/components/MainLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { LoadingScreen } from "@/components/LoadingScreen";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { checkAndCleanDatabase } from '@/lib/cleanOldDatabase';

// Eager load critical routes
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Landing from "./pages/Landing";

// Lazy load non-critical routes for better initial performance
const Index = lazy(() => import("./pages/Index"));
const Profile = lazy(() => import("./pages/Profile"));
const ExamReport = lazy(() => import("./pages/ExamReport"));
const CompareExams = lazy(() => import("./pages/CompareExams"));
const Analytics = lazy(() => import("./pages/Analytics"));
const SharedExamView = lazy(() => import("./pages/SharedExamView"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (previously cacheTime)
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App = () => {
  // Run database cleanup on app initialization
  useEffect(() => {
    console.log('[APP] Initializing application...');
    checkAndCleanDatabase().then(() => {
      console.log('[APP] Database check complete');
    }).catch((error) => {
      console.error('[APP] Database cleanup failed:', error);
    });
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter
                future={{
                  v7_startTransition: true,
                  v7_relativeSplatPath: true,
                }}
              >
                <Suspense fallback={<LoadingScreen message="Carregando aplicação..." />}>
                  <Routes>
                    {/* Public routes */}
                    <Route path="/" element={<Landing />} />
                    <Route path="/auth" element={<Auth />} />

                    {/* Protected routes with MainLayout */}
                    <Route
                      path="/dashboard"
                      element={
                        <ProtectedRoute>
                          <MainLayout />
                        </ProtectedRoute>
                      }
                    >
                      <Route index element={<Index />} />
                      <Route path="analytics" element={<Analytics />} />
                      <Route path="compare" element={<CompareExams />} />
                    </Route>

                    <Route
                      path="/profile"
                      element={
                        <ProtectedRoute>
                          <Profile />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/exam/:examId"
                      element={
                        <ProtectedRoute>
                          <ExamReport />
                        </ProtectedRoute>
                      }
                    />

                    {/* Public shared exam view */}
                    <Route path="/shared/:token" element={<SharedExamView />} />

                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </BrowserRouter>
            </TooltipProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
