import { createBrowserRouter } from 'react-router-dom'
import { LandingPage } from '../features/landing/LandingPage'
import { MixtapePage } from '../features/creator/MixtapePage'
import { LetterPage } from '../features/creator/LetterPage'
import { MemoPage } from '../features/creator/MemoPage'
import { SharePage } from '../features/creator/SharePage'
import { DrivePage } from '../features/drive/DrivePage'
import { NotFoundPage } from '../features/not-found/NotFoundPage'
import { CreatorRouteGuard } from '../features/creator/CreatorRouteGuard'

export const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
  { path: '/create/mixtape', element: <MixtapePage /> },
  {
    path: '/create/letter',
    element: (
      <CreatorRouteGuard step={2}>
        <LetterPage />
      </CreatorRouteGuard>
    ),
  },
  {
    path: '/create/memo',
    element: (
      <CreatorRouteGuard step={3}>
        <MemoPage />
      </CreatorRouteGuard>
    ),
  },
  {
    path: '/create/share',
    element: (
      <CreatorRouteGuard step={4}>
        <SharePage />
      </CreatorRouteGuard>
    ),
  },
  { path: '/drive/:shortId', element: <DrivePage /> },
  { path: '*', element: <NotFoundPage /> },
])
