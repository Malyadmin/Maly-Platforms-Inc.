import { Switch, Route, useLocation } from "wouter";
import HomePage from "./pages/HomePage";
import DiscoverPage from "./pages/DiscoverPage";
import { Redirect } from "@/components/ui/redirect";
import EventPage from "./pages/EventPage";
import ProfilePage from "./pages/ProfilePage";
import CreateEventPage from "./pages/CreateEventPage";
import CreateEventFlowPage from "./pages/CreateEventFlowPage";
import EditEventPage from "./pages/EditEventPage";
import TestCreateEventPage from "./pages/TestCreateEventPage";
import ChatbotPage from "./pages/ChatbotPage";
import ConnectPage from "./pages/ConnectPage";
import ConnectionsPage from "./pages/ConnectionsPage";
import MessagesPage from "./pages/MessagesPage";
import ChatPage from "./pages/ChatPage";
import PremiumPage from "./pages/PremiumPage";
import PremiumSuccessPage from "./pages/PremiumSuccessPage";
import InboxPage from "./pages/InboxPage";
import ProfileEditPage from "./pages/ProfileEditPage";
import TranslatorPage from "./pages/TranslatorPage";
import OndaLindaFestivalPage from "./pages/OndaLindaFestivalPage";
import ProfileGeneratorPage from "./pages/ProfileGeneratorPage";
import ReplitProfilePage from "./pages/ReplitProfilePage";
import EventTicketsPage from "./pages/EventTicketsPage";
import PaymentSuccessPage from "./pages/PaymentSuccessPage";
import PaymentCancelPage from "./pages/PaymentCancelPage";
import AdminPaymentsPage from "./pages/AdminPaymentsPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AiEventDemoPage from "./pages/AiEventDemoPage.jsx";
import AuthPage from "./pages/AuthPage";
import StripeConnectPage from "./pages/StripeConnectPage";
import StripeConnectSuccessPage from "./pages/StripeConnectSuccessPage";
import StripeConnectReauthPage from "./pages/StripeConnectReauthPage";
import ShareEventMembersPage from "./pages/ShareEventMembersPage";
import SelectPeopleToInvitePage from "./pages/SelectPeopleToInvitePage";
import { Layout } from "./components/ui/layout";
import { ThemeProvider } from "./lib/theme-provider";
import { LanguageProvider } from "./lib/language-context";
import { QueryProvider } from "./lib/query-provider";
import { UserProvider } from "./lib/user-provider";
import { useUser } from "@/hooks/use-user";
import { useEffect } from "react";

function AppContent() {
  const [location, setLocation] = useLocation();
  const { user, isLoading } = useUser();

  // This effect only handles initial authentication and URL cleanup after login
  useEffect(() => {
    // Check if we have a session parameter in the URL - if so, we're coming from a login redirect
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('sessionId');
    
    // Handle the session ID in the URL (login redirect case)
    if (sessionId) {
      console.log("Login redirect detected with sessionId:", sessionId);
      // Clean the URL without reloading
      const url = new URL(window.location.href);
      url.searchParams.delete('sessionId');
      url.searchParams.delete('ts');
      window.history.replaceState({}, document.title, url.toString());
      
      // Store session ID in localStorage and skip further checks
      localStorage.setItem('maly_session_id', sessionId);
      return;
    }
    
    // Don't perform redundant auth checks - defer to the Layout component
    // Skip check if we're already on the auth page or during loading
    if (location.startsWith('/auth') || location.startsWith('/payment-') || location.startsWith('/stripe/connect') || isLoading) {
      return;
    }
    
    // Quick check for cached user data without making API calls
    const cachedUser = localStorage.getItem('maly_user_data');
    if (!user && !isLoading && !cachedUser) {
      setLocation('/auth');
    }
  }, [user, isLoading, location, setLocation]);

  // Determine if we should show the layout based on the current route
  // Exclude DiscoverPage from Layout to prevent duplicate headers
  const showLayout = !location.startsWith('/auth') && !location.startsWith('/payment-') && !location.startsWith('/stripe/connect') && !location.startsWith('/discover');

  return (
    <>
      {showLayout ? (
        <Layout>
          <Switch>
            <Route path="/" component={() => <Redirect to="/discover" />} />
            <Route path="/discover" component={DiscoverPage} />
            <Route path="/event/onda-linda-festival" component={OndaLindaFestivalPage} />
            <Route path="/event/:id/tickets" component={EventTicketsPage} />
            <Route path="/event/:id/invite" component={SelectPeopleToInvitePage} />
            <Route path="/event/:id" component={EventPage} />
            <Route path="/edit-event/:id" component={EditEventPage} />
            <Route path="/share-event-members" component={ShareEventMembersPage} />
            <Route path="/profile" component={ProfilePage} />
            <Route path="/profile/:username" component={ProfilePage} />
            <Route path="/create" component={CreateEventPage} />
            <Route path="/create-flow" component={CreateEventFlowPage} />
            <Route path="/test-create" component={TestCreateEventPage} />
            <Route path="/companion" component={ChatbotPage} />
            <Route path="/connect" component={ConnectPage} />
            <Route path="/connections" component={ConnectionsPage} />
            <Route path="/messages" component={MessagesPage} />
            <Route path="/chat/:id" component={ChatPage} />
            <Route path="/premium" component={PremiumPage} />
            <Route path="/premium-success" component={PremiumSuccessPage} />
            <Route path="/inbox" component={InboxPage} />
            <Route path="/profile-edit" component={ProfileEditPage} />
            <Route path="/translator" component={TranslatorPage} />
            <Route path="/profile-setup" component={ProfileGeneratorPage} />
            <Route path="/replit-profile" component={ReplitProfilePage} />
            <Route path="/ai-events" component={AiEventDemoPage} />
            <Route path="/admin" component={AdminDashboardPage} />
            <Route path="/admin/payments" component={AdminPaymentsPage} />
            <Route path="/stripe/connect" component={StripeConnectPage} />
            <Route path="/:rest*">
              {() => <div className="text-center p-8">404 - Page Not Found</div>}
            </Route>
          </Switch>
        </Layout>
      ) : (
        <Switch>
          <Route path="/" component={() => <Redirect to="/discover" />} />
          <Route path="/discover" component={DiscoverPage} />
          <Route path="/auth" component={AuthPage} />
          <Route path="/payment-success" component={PaymentSuccessPage} />
          <Route path="/payment-cancel" component={PaymentCancelPage} />
          <Route path="/stripe/connect" component={StripeConnectPage} />
          <Route path="/stripe/connect/success" component={StripeConnectSuccessPage} />
          <Route path="/stripe/connect/reauth" component={StripeConnectReauthPage} />
          <Route path="/:rest*">
            {() => <AuthPage />}
          </Route>
        </Switch>
      )}
    </>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="nomad-theme">
      <QueryProvider>
        <UserProvider>
          <LanguageProvider>
            <AppContent />
          </LanguageProvider>
        </UserProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}

export default App;