import "./globals.css";

export const metadata = {
  title: "Recipe Trending",
  description: "Join Recipe Trending to find amazing recipes based on ingredients you have. Explore diverse cuisines, save your favorites, and enjoy cooking made simple.",
};
import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter';
import { ThemeProvider } from "../context/ThemeContext";
import StoreProvider from "../redux/StoreProvider";
import { UserProvider } from "../context/UserContext";
import MainLayout from "../layout/MainLayout";
import Analytics from "../components/Analytics";
import ProgressBar from "../components/ProgressBar";
import { MuiToastContainer } from "../utils/toast";

export default async function RootLayout({ children }) {
  let initialNavItems = [];
  let initialFooterItems = [];

  let apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
  if (apiUrl && !apiUrl.startsWith('http://') && !apiUrl.startsWith('https://')) {
    apiUrl = `https://${apiUrl}`;
  }

  if (apiUrl) {
    try {
      const navRes = await fetch(`${apiUrl}/api/manage-nav-items/get-for-navbar`, { next: { revalidate: 60 } });
      if (navRes.ok) {
        const navData = await navRes.json();
        initialNavItems = navData?.data || [];
      }
    } catch (error) {
      console.error("Failed to fetch nav items for SSR", error);
    }

    try {
      const footerRes = await fetch(`${apiUrl}/api/manage-footer-items/get-for-footer`, { next: { revalidate: 60 } });
      if (footerRes.ok) {
        const footerData = await footerRes.json();
        initialFooterItems = footerData?.data || [];
      }
    } catch (error) {
      console.error("Failed to fetch footer items for SSR", error);
    }
  }
  return (
    <html
      lang="en"
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" style={{ backgroundColor: 'var(--bg-primary)', transition: 'background-color 0.3s ease', fontFamily: 'Roboto, Inter, sans-serif' }}>
        {process.env.NEXT_GOOGLE_ANALYTICS_ID && process.env.NODE_ENV === 'production' && (
           <Analytics gaId={process.env.NEXT_GOOGLE_ANALYTICS_ID} />
        )}
        <AppRouterCacheProvider options={{ enableCssLayer: true }}>
          <ThemeProvider>
            <StoreProvider>
              <UserProvider>
                <ProgressBar>
                  <MainLayout initialNavItems={initialNavItems} initialFooterItems={initialFooterItems}>
                    {children}
                  </MainLayout>
                  <MuiToastContainer />
                </ProgressBar>
              </UserProvider>

            </StoreProvider>
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
