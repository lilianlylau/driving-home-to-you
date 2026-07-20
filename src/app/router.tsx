import { createBrowserRouter } from 'react-router-dom'
import { LandingPage } from '../features/landing/LandingPage'
import { MixtapePage } from '../features/creator/MixtapePage'
import { LetterPage } from '../features/creator/LetterPage'
import { MemoPage } from '../features/creator/MemoPage'
import { SharePage } from '../features/creator/SharePage'
import { DrivePage } from '../features/drive/DrivePage'
import { NotFoundPage } from '../features/not-found/NotFoundPage'

export const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
  { path: '/create/mixtape', element: <MixtapePage /> },
  { path: '/create/letter', element: <LetterPage /> },
  { path: '/create/memo', element: <MemoPage /> },
  { path: '/create/share', element: <SharePage /> },
  { path: '/drive/:shortId', element: <DrivePage /> },
  { path: '*', element: <NotFoundPage /> },
])
