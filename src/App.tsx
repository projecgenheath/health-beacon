import { Suspense, lazy, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { MainLayout } from "@/components/MainLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { LoadingScreen } from "@/components/LoadingScreen";
import { NetworkStatusBanner } from "@/components/NetworkStatusBanner";
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
const Reports = lazy(() => import("./pages/Reports"));
const Register = lazy(() => import("./pages/Register"));

// Patient marketplace pages
const RequestExam = lazy(() => import("./pages/patient/RequestExam"));
const Quotations = lazy(() => import("./pages/patient/Quotations"));
const ScheduleAppointment = lazy(() => import("./pages/patient/ScheduleAppointment"));

// Laboratory pages
const LaboratoryDashboard = lazy(() => import("./pages/laboratory/Dashboard"));
const LaboratoryRequests = lazy(() => import("./pages/laboratory/Requests"));
const LaboratoryAppointments = lazy(() => import("./pages/laboratory/Appointments"));

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
              <NetworkStatusBanner />
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
                    <Route path="/register" element={<Register />} />

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
                      <Route path="reports" element={<Reports />} />
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

                    {/* Patient marketplace routes */}
                    <Route
                      path="/patient/request-exam"
                      element={
                        <ProtectedRoute>
                          <RequestExam />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/patient/quotations"
                      element={
                        <ProtectedRoute>
                          <Quotations />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/patient/schedule-appointment"
                      element={
                        <ProtectedRoute>
                          <ScheduleAppointment />
                        </ProtectedRoute>
                      }
                    />

                    {/* Laboratory routes */}
                    <Route
                      path="/laboratory/dashboard"
                      element={
                        <ProtectedRoute>
                          <LaboratoryDashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/laboratory/requests"
                      element={
                        <ProtectedRoute>
                          <LaboratoryRequests />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/laboratory/appointments"
                      element={
                        <ProtectedRoute>
                          <LaboratoryAppointments />
                        </ProtectedRoute>
                      }
                    />

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
