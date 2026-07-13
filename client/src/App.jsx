import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { useRevalidateSession } from './api/authApi';
import { routes } from './router';

const router = createBrowserRouter(routes);

function App() {
  // Revalidate session on every app load
  useRevalidateSession();

  return <RouterProvider router={router} />;
}

export default App;
