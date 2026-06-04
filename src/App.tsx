import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import Assets from './pages/Assets'
import CDSGuideline from './pages/CDSGuideline'
import Placeholder from './pages/Placeholder'
import TaskCenter from './pages/TaskCenter'
import OrderManagement from './pages/Orders'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/orders" replace />} />
          <Route path="/assets"              element={<Assets />} />
          <Route path="/cds-guideline"       element={<CDSGuideline />} />
          <Route path="/task-center"         element={<TaskCenter />} />
          <Route path="/orders"              element={<OrderManagement />} />
          <Route path="/orders/anomalous"    element={<Navigate to="/orders" replace />} />
          <Route path="/orders/all"          element={<Navigate to="/orders" replace />} />
          <Route path="/blank"               element={<Placeholder title="Blank Page" />} />
          <Route path="*"                    element={<Placeholder title="Not Found" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
