import { createBrowserRouter } from 'react-router-dom'
import { Layout } from './layout'
import { HomePage } from '../pages/Home/HomePage'
import { SearchPage } from '../pages/Search/SearchPage'
import { StopPage } from '../pages/Stop/StopPage'
import { ServicePage } from '../pages/Service/ServicePage'
import { VehiclePage } from '../pages/Vehicle/VehiclePage'
import { FavoritesPage } from '../pages/Favorites/FavoritesPage'
import { SettingsPage } from '../pages/Settings/SettingsPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'search', element: <SearchPage /> },
      { path: 'stop/:stopId', element: <StopPage /> },
      { path: 'service/:serviceId', element: <ServicePage /> },
      { path: 'vehicle/:routeCode/:serviceSlug/:stopSlug?', element: <VehiclePage /> },
      { path: 'favorites', element: <FavoritesPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
])
