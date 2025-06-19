import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FiCalendar, FiArrowRight, FiMapPin } from "react-icons/fi";

const AppointmentList = () => {
  const navigate = useNavigate();
  const [s, setS] = useState({ t: "doctor", l: [], d: [], p: [], s: false, i: 0 });
  const [currentPage, setCurrentPage] = useState(1), [itemsPerPage] = useState(5);

  useEffect(() => {
    const f = async () => {
      try {
        const [l, d] = await Promise.all([
          axios.get("https://680b3642d5075a76d98a3658.mockapi.io/Lab/payment"),
          axios.get("https://67e3e1e42ae442db76d2035d.mockapi.io/register/book"),
        ]);
        const e = localStorage.getItem("email")?.trim().toLowerCase();
        const u = localStorage.getItem("userId")?.trim();
        const f = d.data.filter((a) => a.email?.trim().toLowerCase() === e || a.userId?.trim() === u).reverse();
        setS((prev) => ({ ...prev, l: l.data.reverse(), d: f }));
        const p = Object.values(
          f.filter((a) => !["confirmed", "rejected"].includes(a.status?.toLowerCase()))
            .reduce((a, c) => ((a[`${c.specialty}-${c.location}`] = a[`${c.specialty}-${c.location}`] || []).push(c), a), {})
        );
        if (p.length > 0) setS((prev) => ({ ...prev, p })), setTimeout(() => setS((prev) => ({ ...prev, s: true })), 3000);
      } catch (err) {
        console.error(err);
      }
    };
    f();
  }, []);

  const h = (a) => {
    Object.entries({ suggestedLocation: a.location || "", suggestedSpecialty: a.specialty || "", suggestedDoctorType: "AV Swasthya", suggestedSymptoms: a.symptoms || "" }).forEach(([k, v]) => sessionStorage.setItem(k, v));
    navigate("/dashboard/book-appointment");
  };

  const g = (s) =>
    ({
      "Appointment Confirmed": "bg-blue-100 text-blue-800",
      "Technician On the Way": "bg-yellow-100 text-yellow-800",
      "Sample Collected": "bg-purple-100 text-purple-800",
      "Test Processing": "bg-orange-100 text-orange-800",
      "Report Ready": "bg-green-100 text-green-800",
      Cancelled: "bg-red-100 text-red-600",
    }[s] || "bg-gray-100 text-gray-800");

  const c = s.p[s.i] || [], a = c[0];
  const indexOfLastItem = currentPage * itemsPerPage, indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentDoctorAppointments = s.d.slice(indexOfFirstItem, indexOfLastItem), currentLabAppointments = s.l.slice(indexOfFirstItem, indexOfLastItem);
  const totalPagesDoctor = Math.ceil(s.d.length / itemsPerPage), totalPagesLab = Math.ceil(s.l.length / itemsPerPage);

  const handlePageChange = (page) => page >= 1 && page <= (s.t === "doctor" ? totalPagesDoctor : totalPagesLab) && setCurrentPage(page);

  return (
    <div className="pt-6 bg-white p-6 rounded-2xl shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-3">
          {["doctor", "lab"].map((t) => (
            <button key={t} onClick={() => setS((prev) => ({ ...prev, t }))} className={` ${s.t === t ? "btn btn-primary" : "btn btn-secondary"}`}>
              {t.charAt(0).toUpperCase() + t.slice(1)} Appointments
            </button>
          ))}
        </div>
        <button
          onClick={() => navigate(s.t === "lab" ? "/dashboard/lab-tests" : "/dashboard/book-appointment")}
          className="group relative inline-flex items-center px-6 py-2 rounded-full bg-[var(--primary-color)] text-white font-medium tracking-wide overflow-hidden transition-all duration-300 ease-in-out hover:shadow-lg"
        >
          <FiCalendar className="text-lg mr-2 " />
          <span className="transition-all duration-300 ease-in-out group-hover:-translate-x-[120%] opacity-100 group-hover:opacity-0 whitespace-nowrap">Book Appointment</span>
          <span className="absolute left-12 flex items-center gap-1 opacity-0 translate-x-12 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300 ease-in-out whitespace-nowrap">
            <span>Appointment</span>
            <FiArrowRight className="mt-[2px]" />
          </span>
        </button>
      </div>
      {s.t === "doctor" && (
        <div className="">
          <h2 className="h3-heading mb-4">Doctor Appointments</h2>
          <table className="table-container">
            <thead className="table-head">
              <tr className="tr-style">{["Doctor", "Speciality", "Date", "Time", "Status"].map((h) => <th key={h} className="py-2 px-4">{h}</th>)}</tr>
            </thead>
            <tbody className="table-body">
              {currentDoctorAppointments.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="py-2 px-4">{a.doctorName}</td>
                  <td className="py-2 px-4">{a.specialty}</td>
                  <td className="py-2 px-4">{a.date}</td>
                  <td className="py-2 px-4">{a.time}</td>
                  <td className="py-2 px-4">
                    {a.status === "Confirmed" ? (
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full paragraph ">Confirmed</span>
                    ) : a.status?.toLowerCase() === "rejected" ? (
                      <div className="flex items-center space-x-4 paragraph mt-1">
                        <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full ">Rejected</span>
                        <div>
                          <strong>Reason:</strong> {a.rejectReason}
                        </div>
                      </div>
                    ) : (
                      <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">Waiting for {a.doctorName}'s Confirmation</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-center items-center mt-4 gap-4">
            <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="edit-btn">Previous</button>
            <span className="text-sm">Page {currentPage} of {totalPagesDoctor}</span>
            <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPagesDoctor} className="edit-btn">Next</button>
          </div>
        </div>
      )}
      {s.t === "lab" && (
        <div className="">
          <h3 className="h3-heading mb-4">Lab Appointments</h3>
          <table className="table-container">
            <thead className="table-head">
              <tr className="tr-style">{["ID", "Test", "Lab", "Status", "Action"].map((h) => <th key={h} className="py-2 px-4">{h}</th>)}</tr>
            </thead>
            <tbody>
              {currentLabAppointments.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="py-2 px-4 text-center">{a.bookingId}</td>
                  <td className="py-2 px-4 text-center ">{a.testTitle}</td>
                  <td className="py-2 px-4 text-center">{a.labName}</td>
                  <td className="py-2 px-4 text-center">
                    <span className={`px-2 py-1 rounded-full paragraph   ${g(a.status)}`}>{a.status || "Pending"}</span>
                  </td>
                  <td className="py-2 px-4">
                    <button onClick={() => navigate(`/dashboard/track-appointment/${a.bookingId}`)} className="group relative inline-flex items-center justify-center gap-2 px-6 py-2 border border-[var(--accent-color)] text-[var(--accent-color)] rounded-full font-semibold bg-transparent overflow-hidden transition-colors duration-300 ease-in-out hover:bg-[var(--accent-color)] hover:text-white">
                      <FiMapPin className="text-lg transition-transform duration-300 ease-in-out group-hover:scale-110" />
                      <span className="tracking-wide transition-all duration-300 ease-in-out">Track</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-center items-center mt-4 gap-4">
            <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="edit-btn">Previous</button>
            <span className="text-sm">Page {currentPage} of {totalPagesLab}</span>
            <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPagesLab} className="edit-btn">Next</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentList;