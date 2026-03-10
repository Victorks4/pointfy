import { Navigate } from 'react-router-dom';

// Approval workflow removed - redirecting to dashboard
export default function AdminApprovals() {
  return <Navigate to="/dashboard" replace />;
}
