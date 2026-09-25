/**
 * Componente raíz de la aplicación: provee el router y el contenedor de toasts.
 */
import { RouterProvider } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { router } from './router';

export function App() {
  return (
    <>
      <RouterProvider router={router} />
      <ToastContainer position="bottom-right" autoClose={3500} theme="light" />
    </>
  );
}
