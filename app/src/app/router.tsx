/**
 * Definición de rutas (React Router). Cada pestaña del dashboard es una ruta
 * hija del `Layout`. La raíz "/" es la Lista de 49.
 */
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Layout } from './ui/Layout';
import { VistaAciertos } from '@/features/aciertos/pages/VistaAciertos';
import { RankingPage } from '@/features/ranking/pages/RankingPage';
import { PreciosPage } from '@/features/precios/pages/PreciosPage';
import { TendenciasPage } from '@/features/tendencias/pages/TendenciasPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <VistaAciertos fuente="lista" /> },
      { path: 'telas', element: <VistaAciertos fuente="telas" /> },
      { path: 'tendencias', element: <TendenciasPage /> },
      // "Artículos" se unificó con "Telas" (acordeón de colores): se redirige.
      { path: 'articulos', element: <Navigate to="/telas" replace /> },
      { path: 'ranking', element: <RankingPage /> },
      { path: 'precios', element: <PreciosPage /> },
    ],
  },
]);
