

import React from "react";
import { Routes, Route } from "react-router-dom";

// Pages inside the patient dashboard
import Dashboard from "./Dashboard";
import MedicalRecord from "./MedicalRecord";
import Settings from "./Settings";
import AppointmentList from "./AppointmentList";
import Insurance from "./Insurance";
import Billing from "./Billing";
import NearbyPharmacies from "./NearbyPharmacy"
import PatientNotifications from './Notifications';
import PaymentForm from './PaymentForm';
import LabHome from './LabHome';
import TestDetail from './TestDetail';
import CartPage from './CartPage';
import AvailableLabs from "./AvailableLab";
import LabBooking from "./LabBooking";
import MultiStepForm from "../../../../components/BookApp";
import PaymentLab from "./PaymentLab";
import TrackAppointment from "./TrackApp";
import Emergency from "./Emergency";
import Tabs from './Tabs'
 import BookLab from './BookLab';
const PdashboardRoutes = () => {
  return (
    <Routes>
      <Route index element={<Dashboard />} />
      <Route path="medical-record" element={<Tabs/>} />
      <Route path="settings" element={<Settings />} />
      <Route path="app" element={<AppointmentList />} />
      <Route path="book-appointment" element={<MultiStepForm />} />

      {/* Optional extra routes */}
      <Route path="insurance" element={<Insurance/>} />
      <Route path="billing" element={<Billing/>} />
      <Route path="notifications" element={<PatientNotifications/>} />
      <Route path="/payment" element={<PaymentForm />} />
      <Route path="shopping" element={<h1>Online Shopping</h1>} />
      <Route path="emergency" element={<h1>Emergency Info</h1>} />
      <Route path="lab-tests" element={<LabHome />} />
      <Route path="lab-tests/test/:id" element={<TestDetail />} />
      <Route path="cart" element={<CartPage />} />
      <Route path="available-labs/:id" element={<AvailableLabs />} />
      <Route path="lab-booking/:id" element={<LabBooking />} />
      <Route path="book-app/:id" element={<BookLab />} />
      <Route path="payment1" element={<PaymentLab />} />
      <Route path="track-appointment/:bookingId" element={<TrackAppointment />} />
      
      <Route path="ambulance" element={<Emergency/>} />
      <Route path="pharmacy" element={<NearbyPharmacies/>} />

      {/* Fallback route */}
      <Route path="*" element={<h1>404 - Page Not Found</h1>} />
    </Routes>
  );
};

export default PdashboardRoutes;
