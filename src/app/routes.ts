import { createBrowserRouter } from 'react-router';
import RoleSelect from './pages/RoleSelect';
import PatientPortal from './pages/PatientPortal';
import RehabSession from './pages/RehabSession';
import FamilyDashboard from './pages/FamilyDashboard';
import DoctorPortal from './pages/DoctorPortal';
import Blueprint from './pages/Blueprint';

export const router = createBrowserRouter([
  { path: '/', Component: RoleSelect },
  { path: '/patient', Component: PatientPortal },
  { path: '/patient/rehab/:exerciseId', Component: RehabSession },
  { path: '/family', Component: FamilyDashboard },
  { path: '/doctor', Component: DoctorPortal },
  { path: '/blueprint', Component: Blueprint },
]);
