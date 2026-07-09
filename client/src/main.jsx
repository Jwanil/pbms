import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider, MutationCache } from '@tanstack/react-query';
import { ConfigProvider, App as AntApp } from 'antd';
import App from './App';
import antdTheme from './theme/antdTheme';
import './index.css';

let globalMessage = null;

const GlobalMessageConfig = () => {
  const { message } = AntApp.useApp();
  globalMessage = message;
  return null;
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
    },
  },
  mutationCache: new MutationCache({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (error) => {
      const status = error?.response?.status;
      const data = error?.response?.data;
      
      // Ignore 401 (handled by interceptor refresh/redirect)
      // Ignore VALIDATION_ERROR (handled by field-level useFormErrors hook)
      if (status !== 401 && data?.code !== 'VALIDATION_ERROR') {
        if (globalMessage) {
          globalMessage.error(data?.message || "Something went wrong");
        }
      }
    }
  }),
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ConfigProvider theme={antdTheme}>
        <AntApp>
          <GlobalMessageConfig />
            <App />
        </AntApp>
      </ConfigProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
