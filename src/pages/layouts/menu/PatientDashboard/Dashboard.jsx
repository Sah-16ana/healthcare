import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { CircleUser, Heart, Users, ClipboardCheck, Clipboard } from 'lucide-react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import DashboardOverview from './DashboardOverview';

const API = {
  health: 'https://680cc0c92ea307e081d4edda.mockapi.io/personalHealthDetails',
  family: 'https://6808fb0f942707d722e09f1d.mockapi.io/FamilyData',
  insurance: 'https://68355850cd78db2058c10680.mockapi.io/insurance'
};

const defaults = {
  family: { name: '', relation: '', number: '', diseases: [], email: '' },
  insurance: { provider: '', policyNumber: '', coverageType: '', startDate: '', endDate: '', coverageAmount: '', primaryHolder: false },
  user: { 
    name: '', email: '', gender: '', phone: '', dob: '', bloodGroup: '', height: '', weight: '', 
    isAlcoholic: false, isSmoker: false, allergies: '', surgeries: '', 
    familyHistory: { diabetes: false, cancer: false, heartDisease: false, mentalHealth: false, disability: false }, 
    familyMembers: [], additionalDetails: {}
  }
};

function Dashboard() {
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const [state, setState] = useState({
    userData: { ...defaults.user, additionalDetails: defaults.insurance },
    activeSection: 'basic',
    showModal: false,
    profileCompletion: 25,
    familyInput: defaults.family,
    feedback: { show: false, message: '', type: '' }
  });

  const getProgressColor = p => p <= 33 ? 'text-[#FFA500]' : p < 100 ? 'text-yellow-500' : 'text-green-500';
  const showFeedback = (message, type = 'success') => {
    setState(prev => ({ ...prev, feedback: { show: true, message, type } }));
    setTimeout(() => setState(prev => ({ ...prev, feedback: { show: false, message: '', type: '' } })), 3000);
  };

  const fetchAllUserData = async (email) => {
    try {
      const [health, family, insurance] = await Promise.all([
        axios.get(`${API.health}?email=${encodeURIComponent(email)}`),
        axios.get(`${API.family}?email=${email}`),
        axios.get(`${API.insurance}?email=${encodeURIComponent(email)}`)
      ]);

      let healthData = health.data[0] || { ...defaults.user, email, name: `${user?.firstName || 'Guest'} ${user?.lastName || ''}`.trim() };
      if (!health.data[0]) {
        const response = await axios.post(API.health, healthData);
        healthData = { ...healthData, id: response.data.id };
      }

      return { ...healthData, familyMembers: family.data, additionalDetails: insurance.data[0] || defaults.insurance };
    } catch (error) {
      console.error('Error fetching user data:', error);
      throw error;
    }
  };

  useEffect(() => {
    const loadUserData = async () => {
      if (!user?.email) {
        showFeedback('Please login to access your data', 'error');
        navigate('/login');
        return;
      }
      try {
        const data = await fetchAllUserData(user.email);
        setState(prev => ({ ...prev, userData: data }));
        localStorage.setItem('userData', JSON.stringify(data));
      } catch (error) {
        showFeedback('Error loading user data', 'error');
      }
    };
    loadUserData();
  }, [user, navigate]);

  const handleAdditionalDetailsSubmit = async (e) => {
    e.preventDefault();
    if (!user?.email) {
      showFeedback('Please login to save data', 'error');
      return;
    }

    const formData = new FormData(e.currentTarget);
    const insuranceData = {
      provider: formData.get('provider')?.toString() || '',
      policyNumber: formData.get('policyNumber')?.toString() || '',
      coverageType: formData.get('coverageType')?.toString() || '',
      startDate: formData.get('startDate')?.toString() || '',
      endDate: formData.get('endDate')?.toString() || '',
      coverageAmount: formData.get('coverageAmount')?.toString() || '',
      primaryHolder: formData.get('primaryHolder') === 'on',
      email: user.email
    };

    try {
      const existingData = await axios.get(`${API.insurance}?email=${encodeURIComponent(user.email)}`);
      await (existingData.data.length > 0 
        ? axios.put(`${API.insurance}/${existingData.data[0].id}`, insuranceData)
        : axios.post(API.insurance, insuranceData));

      const updatedData = await fetchAllUserData(user.email);
      setState(prev => ({ ...prev, userData: updatedData, showModal: false }));
      localStorage.setItem('userData', JSON.stringify(updatedData));
      showFeedback('Insurance details saved successfully');
    } catch (error) {
      console.error('Error saving insurance data:', error);
      showFeedback('Failed to save insurance details', 'error');
    }
  };

  const handleDeleteInsurance = async () => {
    if (!user?.email) {
      showFeedback('Please login to delete data', 'error');
      return;
    }

    try {
      const existingData = await axios.get(`${API.insurance}?email=${encodeURIComponent(user.email)}`);
      if (existingData.data.length > 0) {
        await axios.delete(`${API.insurance}/${existingData.data[0].id}`);
        const updatedData = await fetchAllUserData(user.email);
        setState(prev => ({ ...prev, userData: updatedData, showModal: false }));
        localStorage.setItem('userData', JSON.stringify(updatedData));
        showFeedback('Insurance details deleted successfully');
      } else {
        showFeedback('No insurance data found to delete', 'warning');
      }
    } catch (error) {
      console.error('Error deleting insurance data:', error);
      showFeedback('Failed to delete insurance details', 'error');
    }
  };

  const handleFamilyInputChange = (e) => {
    const { name, value } = e.target;
    setState(prev => ({ ...prev, familyInput: { ...prev.familyInput, [name]: value } }));
  };

  const handleDiseaseCheckbox = (e) => {
    const { value, checked } = e.target;
    setState(prev => ({
      ...prev,
      familyInput: {
        ...prev.familyInput,
        diseases: checked ? [...prev.familyInput.diseases, value] : prev.familyInput.diseases.filter(d => d !== value)
      }
    }));
  };

  const handleAddFamilyMember = async (e) => {
    e.preventDefault();
    if (!user?.email) {
      showFeedback('Please login to add family member', 'error');
      return;
    }

    if (!state.familyInput.name || !state.familyInput.relation) {
      showFeedback('Name & relation required', 'warning');
      return;
    }

    try {
      const familyMemberData = {
        ...state.familyInput,
        email: user.email,
        name: state.familyInput.name,
        relation: state.familyInput.relation,
        number: state.familyInput.number,
        diseases: state.familyInput.diseases
      };

      if (state.familyInput.id) {
        // Update existing family member
        await axios.put(`${API.family}/${state.familyInput.id}`, familyMemberData);
      } else {
        // Create new family member
        await axios.post(API.family, familyMemberData);
      }

      // Fetch updated family members
      const response = await axios.get(`${API.family}?email=${user.email}`);
      const updatedUserData = {
        ...state.userData,
        familyMembers: response.data
      };
      setState(prev => ({ ...prev, userData: updatedUserData }));
      localStorage.setItem('userData', JSON.stringify(updatedUserData));
      
      setState(prev => ({ ...prev, familyInput: defaults.family }));
      showFeedback('Family member saved successfully');
    } catch (error) {
      console.error('Error saving family member:', error);
      showFeedback('Failed to save family member', 'error');
    }
  };

  const handleDeleteFamilyMember = async (familyMemberId) => {
    if (!familyMemberId) {
      console.error('Missing family member ID');
      showFeedback('Invalid member ID', 'error');
      return;
    }

    try {
      console.log('Attempting to delete member ID:', familyMemberId);
      await axios.delete(`${API.family}/${familyMemberId}`);

      const response = await axios.get(`${API.family}?email=${user.email}`);
      setState(prev => ({ ...prev, userData: { ...prev.userData, familyMembers: response.data } }));

      showFeedback('Family member deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting family member:', error);
      if (error.response?.status === 404) {
        showFeedback('Family member not found (maybe already deleted)', 'warning');
      } else {
        showFeedback('Failed to delete family member', 'error');
      }
    }
  };

  const handlePersonalHealthSubmit = async (e) => {
    e.preventDefault();
    if (!user?.email) {
      showFeedback('Please login to save data', 'error');
      return;
    }

    const formData = new FormData(e.currentTarget);
    const healthData = {
      height: formData.get('height')?.toString() || '',
      weight: formData.get('weight')?.toString() || '',
      bloodGroup: formData.get('bloodGroup')?.toString() || '',
      surgeries: formData.get('surgeries')?.toString() || '',
      allergies: formData.get('allergies')?.toString() || '',
      isSmoker: formData.get('isSmoker') === 'on',
      isAlcoholic: formData.get('isAlcoholic') === 'on',
      email: user.email
    };

    try {
      const existingData = await axios.get(`${API.health}?email=${encodeURIComponent(user.email)}`);
      await (existingData.data.length > 0 
        ? axios.put(`${API.health}/${existingData.data[0].id}`, healthData)
        : axios.post(API.health, healthData));

      const updatedData = await fetchAllUserData(user.email);
      setState(prev => ({ ...prev, userData: updatedData, showModal: false }));
      localStorage.setItem('userData', JSON.stringify(updatedData));
      showFeedback('Personal health details saved successfully');
    } catch (error) {
      console.error('Error saving personal health data:', error);
      showFeedback('Failed to save personal health details', 'error');
    }
  };

  const handleGenerateCard = () => navigate("/healthcard");
  const sections = [
    { id: 'basic', name: 'Basic Details', icon: 'user' },
    { id: 'personal', name: 'Personal Health', icon: 'heart' },
    { id: 'family', name: 'Family Details', icon: 'users' },
    { id: 'additional', name: 'Additional Details', icon: 'clipboard' } // Added
  ];
  const completionStatus = {
    basic: true,
    personal: Boolean(state.userData.height && state.userData.weight && state.userData.bloodGroup),
    family: Boolean(state.userData.familyMembers.length > 0),
    additional: Boolean(state.userData.additionalDetails.provider) // Added
  };

  useEffect(() => {
    const completionStatus = {
      basic: true,
      personal: Boolean(state.userData.height && state.userData.weight && state.userData.bloodGroup),
      family: Boolean(state.userData.familyMembers.length > 0)
    };
    const completedSections = Object.values(completionStatus).filter(Boolean).length;
    setState(prev => ({ ...prev, profileCompletion: Math.round((completedSections / Object.keys(completionStatus).length) * 100) }));
  }, [state.userData]);

  return (
    <div className="min-h-screen ">
      <div className="bg-[var(--primary-color)] text-[var(--color-surface)] p-3 sm:p-7 rounded-xl overflow-x-auto">
        <div className="flex flex-nowrap items-center gap-6 min-w-max">
          <div className="relative w-24 h-24 shrink-0">
            <div className="w-full h-full rounded-full bg-[var(--color-surface)]/60 flex items-center justify-center">
              <svg className="absolute top-0 left-0 w-full h-full -rotate-90" viewBox="0 0 36 36">
                <circle className="text-[var(--color-surface)]" strokeWidth="1" stroke="currentColor" fill="none" r="16" cx="18" cy="18" />
                <circle 
                  className={getProgressColor(state.profileCompletion)} 
                  strokeWidth="2" 
                  strokeDasharray="100" 
                  strokeDashoffset={100 - state.profileCompletion} 
                  strokeLinecap="round" 
                  stroke="currentColor" 
                  fill="none" 
                  r="16" 
                  cx="18" 
                  cy="18" 
                />
              </svg>
              <CircleUser className="w-16 h-16 text-[var(--color-surface)]" />
            </div>
            <div className={`absolute -bottom-1 -right-1 ${getProgressColor(state.profileCompletion)} bg-[var(--color-surface)] font-bold px-3 py-1 rounded-full text-xs`}>
              {state.profileCompletion}%
            </div>
          </div>
          <div className="flex flex-nowrap items-center gap-6">
            <div className="flex flex-col">
              <span className="text-sm text-[var(--accent-color)]">Name</span>
              <span className="text-lg">{user?.firstName || "Guest"} {user?.lastName || ""}</span>
            </div>
            <div className="h-8 w-px bg-[var(--color-surface)]" />
            <div className="flex flex-col">
              <span className="text-sm text-[var(--accent-color)]">DOB</span>
              <span className="text-lg">{user?.dob || "N/A"}</span>
            </div>
            <div className="h-8 w-px bg-[var(--color-surface)]" />
            <div className="flex flex-col">
              <span className="text-sm text-[var(--accent-color)]">Gender</span>
              <span className="text-lg">{user?.gender || "N/A"}</span>
            </div>
            <div className="h-8 w-px bg-[var(--color-surface)]" />
            <div className="flex flex-col">
              <span className="text-sm text-[var(--accent-color)]">Phone</span>
              <span className="text-lg">{user?.phone || "N/A"}</span>
            </div>
            <div className="h-8 w-px bg-[var(--color-surface)]" />
            <div className="flex flex-col">
              <span className="text-sm text-[var(--accent-color)]">Blood Group</span>
              <span className="text-lg">{state.userData.bloodGroup || "Not Set"}</span>
            </div>
          </div>
          <button onClick={handleGenerateCard} className="shrink-0 px-4 py-4 rounded bg-[var(--accent-color)] font-semibold text-sm text-[var(--color-surface)]">Generate Health Card</button>
        </div>
      </div>

      <div className="mt-6 sm:mt-10 flex gap-4 sm:gap-6 flex-wrap">
        {sections.map((section) => {
          const isActive = state.activeSection === section.id;
          const isCompleted = completionStatus[section.id];
          return (
            <button 
              key={section.id} 
              onClick={() => {
                setState(prev => ({ ...prev, activeSection: section.id }));
                if (section.id !== 'basic') setState(prev => ({ ...prev, showModal: true }));
              }}
              className={`btn btn-primary
                ${isActive ? 'btn btn-primary' : 'btn btn-primary'} transition-all duration-300`}
            >
              {section.icon === 'user' && <CircleUser className="w-5 h-5 sm:w-6 sm:h-6" />}
              {section.icon === 'heart' && <Heart className="w-5 h-5 sm:w-6 sm:h-6" />}
              {section.icon === 'users' && <Users className="w-5 h-5 sm:w-6 sm:h-6" />}
              {section.icon === 'clipboard' && <Clipboard className="w-5 h-5 sm:w-6 sm:h-6" />}
              {section.name}
              {isCompleted && <ClipboardCheck className="text-[var(--accent-color)] ml-1 animate-pulse" />}
            </button>
          );
        })}
      </div>

      {state.feedback.show && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
          state.feedback.type === 'success-green'
            ? 'bg-[var(--accent-color)] text-[var(--color-surface)]'
            : state.feedback.type === 'success'
            ? 'bg-[var(--accent-color)] text-[var(--color-surface)]'
            : 'bg-red-100 text-red-800'
        } transition-all duration-300 transform translate-y-0 opacity-100`}>
          {state.feedback.message}
        </div>
      )}

      {state.showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 overflow-y-auto py-10">
          <div className="bg-[var(--color-surface)] rounded-xl p-6 w-full max-w-xl mx-4">
            {state.activeSection === 'personal' && (
              <form onSubmit={handlePersonalHealthSubmit} className="space-y-4">
                <h4 className="h4-heading">Personal Health Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-[var(--color-overlay)] mb-1">Height (cm)</label><input name="height" type="number" defaultValue={state.userData.height} className="input-field" required /></div>
                  <div><label className="block text-sm font-medium text-[var(--color-overlay)] mb-1">Weight (kg)</label><input name="weight" type="number" defaultValue={state.userData.weight} className="input-field" required /></div>
                </div>
                <div><label className="block text-sm font-medium text-[var(--color-overlay)] mb-1">Blood Group</label><select name="bloodGroup" defaultValue={state.userData.bloodGroup} className="input-field" required><option value="">Select Blood Group</option>{['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(g => <option key={g} value={g}>{g}</option>)}</select></div>
                <div><label className="block text-sm font-medium text-[var(--color-overlay)] mb-1">Surgeries (if any)</label><input name="surgeries" defaultValue={state.userData.surgeries} className="input-field" /></div>
                <div><label className="block text-sm font-medium text-[var(--color-overlay)] mb-1">Allergies</label><input name="allergies" defaultValue={state.userData.allergies} className="input-field" /></div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" name="isSmoker" defaultChecked={state.userData.isSmoker} /> Do you smoke?</label>
                  <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" name="isAlcoholic" defaultChecked={state.userData.isAlcoholic} /> Do you consume alcohol?</label>
                </div>
                <div className="flex justify-end gap-4 mt-6">
                  <button type="button" onClick={() => setState(prev => ({ ...prev, showModal: false }))} className="btn-secondary">Cancel</button>
                  <button type="submit" className="btn btn-primary">Save</button>
                </div>
              </form>
            )}
            {state.activeSection === 'family' && (
              <div className="space-y-6 mt-10 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-[var(--color-overlay)] scrollbar-track-transparent ">
                <h4 className="h4-heading">Family History</h4>
                <form onSubmit={handleAddFamilyMember} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input name="name" placeholder="Name" value={state.familyInput.name} onChange={handleFamilyInputChange} className="input-field" required />
                    <input name="relation" placeholder="Relation" value={state.familyInput.relation} onChange={handleFamilyInputChange} className="input-field" required />
                  </div>
                  <input name="number" placeholder="Phone Number" value={state.familyInput.number} onChange={handleFamilyInputChange} className="input-field" />
                  <div>
                    <label className="block font-semibold mb-1">Health Conditions (optional):</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 max-h-40 overflow-y-auto pr-2">
                      {['Diabetes', 'Hypertension', 'Cancer', 'Heart Disease', 'Asthma', 'Stroke', 'Alzheimer\'s', 'Arthritis', 'Depression', 'Chronic Kidney Disease', 'Osteoporosis', 'Liver Disease', 'Thyroid Disorders'].map(disease => (
                        <label key={disease} className="flex items-center gap-2 text-sm">
                          <input type="checkbox" value={disease} checked={state.familyInput.diseases.includes(disease)} onChange={handleDiseaseCheckbox} className="" />
                          {disease}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button type="submit" className="btn btn-primary">Add Family Member</button>
                  </div>
                </form>
                {state.userData.familyMembers.length > 0 && (
                  <div className="mt-6 space-y-3">
                    <h4 className="h4-heading">Added Family Members:</h4>
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                      {state.userData.familyMembers.map((member, index) => (
                        <div key={index} className="p-4 rounded-lg shadow-sm flex justify-between items-start transition-all hover:shadow-md">
                          <div>
                            <p className="font-medium">{member.name}</p>
                            <p className="text-sm text-[var(--color-overlay)]"><span className="font-medium">Relation:</span> {member.relation}</p>
                            {member.number && <p className="text-sm text-[var(--color-overlay)]"><span className="font-medium">Phone:</span> {member.number}</p>}
                            {member.diseases.length > 0 && <p className="text-sm text-[var(--color-overlay)] mt-1"><span className="font-medium">Health Conditions:</span> <span className="ml-1">{member.diseases.join(', ')}</span></p>}
                          </div>
                          <button onClick={() => handleDeleteFamilyMember(member.id)} className="delete-btn">Delete</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex justify-end gap-4 mt-6 pt-4 border-t">
                  <button type="button" onClick={() => setState(prev => ({ ...prev, showModal: false }))} className="btn-secondary">Cancel</button>
                  <button type="button" onClick={() => setState(prev => ({ ...prev, showModal: false }))} className="btn btn-primary">Save</button>
                </div>
              </div>
            )}

            {state.activeSection === 'additional' && (
              <form onSubmit={handleAdditionalDetailsSubmit} className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="h4-heading">Additional Details</h4>
                  {state.userData.additionalDetails.provider && (
                    <button 
                      type="button" 
                      onClick={handleDeleteInsurance}
                      className="text-red-500 hover:text-red-700 text-sm font-medium"
                    >
                      Delete Insurance Details
                    </button>
                  )}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-[var(--color-overlay)] mb-1">Insurance Provider</label>
                    <input name="provider" defaultValue={state.userData.additionalDetails.provider} className="input-field" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-[var(--color-overlay)] mb-1">Policy Number</label>
                    <input name="policyNumber" defaultValue={state.userData.additionalDetails.policyNumber} className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-overlay)] mb-1">Coverage Type</label>
                    <select name="coverageType" defaultValue={state.userData.additionalDetails.coverageType} className="input-field">
                      <option value="">Select Coverage Type</option>
                      {['Individual', 'Family', 'Group', 'Senior Citizen', 'Critical Illness', 'Accident'].map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-overlay)] mb-1">Coverage Amount</label>
                    <input name="coverageAmount" defaultValue={state.userData.additionalDetails.coverageAmount} className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-overlay)] mb-1">Start Date</label>
                    <input name="startDate" type="date" defaultValue={state.userData.additionalDetails.startDate} className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-overlay)] mb-1">End Date</label>
                    <input name="endDate" type="date" defaultValue={state.userData.additionalDetails.endDate} className="input-field" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" name="primaryHolder" defaultChecked={state.userData.additionalDetails.primaryHolder} />
                      I am the primary policy holder
                    </label>
                  </div>
                </div>
                <div className="flex justify-end gap-4 mt-6">
                  <button type="button" onClick={() => setState(prev => ({ ...prev, showModal: false }))} className="btn-secondary">Cancel</button>
                  <button type="submit" className="btn btn-primary">Save</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <div className="mt-8">
        <DashboardOverview />
      </div>
    </div>
  );
}
export default Dashboard;


