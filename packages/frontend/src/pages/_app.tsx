import type { AppProps } from 'next/app';
import '@/styles/globals.css';
import { config } from '@fortawesome/fontawesome-svg-core';
import '@fortawesome/fontawesome-svg-core/styles.css';
import { WagmiConfig, configureChains, createConfig, mainnet, useAccount } from 'wagmi';
import { publicProvider } from 'wagmi/providers/public';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Seo } from '@/components/global/Seo';
import Head from 'next/head';
import { ValidUserWarning } from '@/components/global/ValidUserWarning';
import { getDefaultWallets } from '@rainbow-me/rainbowkit';
import { createContext, useEffect, useState } from 'react';
import useUserInfo from '@/hooks/useUserInfo';
import { PropsContextType, UserContextType } from '@/types/components';
import { NotificationsContextType } from '@/types/notifications';
import usePushRoute from '@/hooks/usePushRoute';
import { RouteLoadingSpinner } from '@/components/global/RouteLoadingSpinner';
import { Header } from '@/components/Header';
import { useNotifications } from '@/hooks/useNotifications';
import { ErrorBoundary } from 'react-error-boundary';
import { ErrorPage } from '@/components/global/ErrorPage';
import { error as TEXT } from '@/lib/text';
import { useProposals } from '@/hooks/useProposals';

config.autoAddCss = false;

const { chains, publicClient } = configureChains([mainnet], [publicProvider()]);

const { connectors } = getDefaultWallets({
  appName: 'Nouns Nymz',
  projectId: '564add972ca30e293482fd9361543d69',
  chains,
});

const appConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
});

// React query client
const queryClient = new QueryClient();

export const UserContext = createContext<UserContextType | null>(null);
export const NotificationsContext = createContext<NotificationsContextType | null>(null);
export const PropsContext = createContext<PropsContextType | null>(null);

export default function App({ Component, pageProps }: AppProps) {
  const { address } = useAccount();
  const { nymOptions, setNymOptions, isValid } = useUserInfo({ address: address });
  const { notifications, unread, isLoading, setAsRead, fetchNotifications, lastRefresh, errorMsg } =
    useNotifications();
  const [isMobile, setIsMobile] = useState(false);
  const [postInProg, setPostInProg] = useState(false);
  const { routeLoading, pushRoute } = usePushRoute();
  const { proposals } = useProposals();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const userCtx = {
    isMobile,
    nymOptions,
    setNymOptions,
    postInProg,
    setPostInProg,
    isValid,
    routeLoading,
    pushRoute,
  };

  const notificationsCtx = {
    notifications,
    unread,
    isLoading,
    setAsRead,
    fetchNotifications,
    lastRefresh,
    errorMsg,
  };

  const propsCtx = { proposals };

  return (
    <QueryClientProvider client={queryClient}>
      <WagmiConfig config={appConfig}>
        <UserContext.Provider value={userCtx}>
          <PropsContext.Provider value={propsCtx}>
            <Head>
              <link type="favicon" rel="icon" href="/favicon-3.ico" />
            </Head>
            <Seo />
            {routeLoading && <RouteLoadingSpinner />}
            <ErrorBoundary fallback={<ErrorPage title={TEXT.title} subtitle={TEXT.subtitle} />}>
              <NotificationsContext.Provider value={notificationsCtx}>
                <Header />
                <Component {...pageProps} />
              </NotificationsContext.Provider>
              <ValidUserWarning />
            </ErrorBoundary>
          </PropsContext.Provider>
        </UserContext.Provider>
      </WagmiConfig>
    </QueryClientProvider>
  );
}
