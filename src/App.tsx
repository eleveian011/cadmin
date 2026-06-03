import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import Assets from './pages/Assets'
import CDSGuideline from './pages/CDSGuideline'
import Placeholder from './pages/Placeholder'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/assets" replace />} />
          <Route path="/assets"        element={<Assets />} />
          <Route path="/cds-guideline" element={<CDSGuideline />} />
          <Route path="/blank"         element={<Placeholder title="Blank Page" />} />
          <Route path="*"              element={<Placeholder title="Not Found" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
