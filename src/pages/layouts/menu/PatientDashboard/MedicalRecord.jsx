import React, { useEffect, useState } from "react";
import axios from "axios";
import { FileText } from 'lucide-react';
const MedicalRecords = () => {
  const [records, setRecords] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const rowsPerPage = 4; // Show 4 rows per page
  useEffect(() => {
    axios
      .get("https://6809f36e1f1a52874cde79fe.mockapi.io/note")
      .then((res) => setRecords(res.data))
      .catch((err) => console.error(err));
  }, []);
  const openNoteModal = (noteData) => {
    setSelectedNote(noteData);
    setIsModalOpen(true);
  };
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedNote(null);
  };
  const formatDate = (dateString) => {
    if (!dateString) return "Unknown";
    return new Date(dateString).toLocaleDateString();
  };
  const totalPages = Math.ceil(records.length / rowsPerPage);
  const paginatedRecords = records.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  return (
    <div className="overflow-x-auto p-6 ">
      <h4 className="h4-heading mb-4"> Medical Records </h4>
      <table className="table-container">
        <thead> <tr className="table-head">
            <th className=" py-3 ">Appointment Date</th>
            <th className=" py-3 ">Diagnosis</th>
            <th className="py-3 ">Doctor Name</th>
            <th className=" py-3 ">Doctor's Note</th>
          </tr> </thead>
        <tbody className="table-body">
          {paginatedRecords.map((item, index) => (
            <tr key={index} className="tr-style text-center align-middle">
              <td className="py-2 px-4">{formatDate(item.appointmentDate)}</td>
              <td className="py-2 px-4">{item.symptoms}</td>
              <td className="py-2 px-4">{item.doctorName}</td>
              <td className="py-2 px-4">
                <button onClick={() => openNoteModal(item)}
                  className="group relative view-btn p-2 rounded-full border border-[var(--accent-color)] text-[var(--accent-color)] bg-white shadow-md hover:bg-[var(--accent-color)] hover:text-white transition-all duration-300 hover:scale-105"  >
                  <span className="absolute inset-0 rounded-full animate-[subtle-glow_1.8s_ease-in-out_infinite] opacity-60 z-0" />
                  <FileText className="w-5 h-5 relative z-10 transition-all duration-300 group-hover:animate-[paper-wobble_0.6s]" />
                </button> </td> </tr>   ))} </tbody>  </table>
      <div className="flex justify-end items-center gap-4 mt-4">
        <button  className="edit-btn"
          onClick={() => setPage(page - 1)}
          disabled={page === 1}> Previous
        </button> <span className="paragraph">
          Page {page} of {totalPages} </span>
        <button className="edit-btn"
          onClick={() => setPage(page + 1)}
          disabled={page === totalPages}>  Next</button> </div>
      {isModalOpen && selectedNote && (
        <div className="fixed inset-0 bg-black/40 flex justify-end items-center z-50">
          <div className="relative bg-[var(--color-surface)] px-6 pt-6 pb-10 rounded-xl shadow-xl w-full max-w-md border border-[var(--color-overlay)] animate-fadeIn overflow-hidden">
            <button onClick={closeModal} className="absolute top-4 right-4 text-[var(--color-overlay)] hover:text-red-600 text-2xl font-bold" aria-label="Close">&times;</button>
            <h4 className="h4-heading">Doctor's Note</h4>
            <div className="input-field mt-3">
              {selectedNote.note || "No note available."}
            </div>
            <div className="text-right text-xs text-[var(--color-overlay)] mt-4 pr-1">
              Last Updated: {formatDate(selectedNote.createdAt)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicalRecords;