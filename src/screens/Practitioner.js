import React, { useState, useEffect } from 'react';
import { firestore } from '../utils/Firebase';
import { collection, query, where, getDocs, updateDoc, doc, getDoc } from 'firebase/firestore';
import axios from 'axios'; 
const PractitionerComponent = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newAppointmentDate, setNewAppointmentDate] = useState('');
    const [patientEmail, setPatientEmail] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const q = query(collection(firestore, 'appointment_booking'), where('bookingconfirmed', '==', 'Pending'));
            const querySnapshot = await getDocs(q);
            const appointmentData = await Promise.all(querySnapshot.docs.map(async (appointmentDoc) => {
                const appointment = appointmentDoc.data();
                const practiceDocRef = doc(firestore, 'practice', appointment.PracticeId);
                const [ practiceDocSnapshot] = await Promise.all([
                    getDoc(practiceDocRef)
                ]);
                const hospitalName = practiceDocSnapshot.exists ? practiceDocSnapshot.data().name : 'Unknown Hospital';
                return {
                    id: appointmentDoc.id,
                    hospitalName,
                    ...appointment
                };
            }));
            setAppointments(appointmentData);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching appointments:', error);
        }
    };

    const handleAccept = async (id) => {
        try {
            await updateDoc(doc(firestore, 'appointment_booking', id), { bookingconfirmed: 'Approved' });
            setAppointments(appointments.filter(appointment => appointment.id !== id));
        } catch (error) {
            console.error('Error accepting appointment:', error);
        }
    };

    const handleReject = async (id) => {
        try {
            await updateDoc(doc(firestore, 'appointment_booking', id), { bookingconfirmed: 'Rejected' });
            setAppointments(appointments.filter(appointment => appointment.id !== id));
        } catch (error) {
            console.error('Error rejecting appointment:', error);
        }
    };

    const handleOfferAlternative = (patientEmail) => {
        setShowModal(true);
        setPatientEmail(patientEmail);
    };

    const handleModalClose = () => {
        setShowModal(false);
        setNewAppointmentDate('');
    };

    const handleSendMail = async () => {
      try {
          // Make a POST request to the server endpoint
          const response = await axios.post('/send-email', {
              to: patientEmail, // Patient's email address
              subject: 'New Appointment Date', // Email subject
              text: `Your new appointment date is ${newAppointmentDate}` // Email body
          });
  
          console.log(response.data); // Log success message
          handleModalClose(); // Close the modal after sending the email
      } catch (error) {
          console.error('Error sending email:', error); // Log any errors
      }
  };
    return (
        <div className="container mx-auto">
            <h1 className="text-2xl font-bold mb-4">Pending Appointments</h1>
            {loading ? (
                <p>Loading...</p>
            ) : (
                <div className="grid grid-cols-4 gap-4">
                    {appointments.map(appointment => (
                        <div key={appointment.id} className="border p-4">
                            <p><strong>Patient Name:</strong> {appointment.patientName}</p>
                            <p><strong>Appointment Date:</strong> {appointment.appointmentDate}</p>
                            <p><strong>Consulting Service:</strong> {appointment.consultingService}</p>
                            <p><strong>Hospital Name:</strong> {appointment.hospitalName}</p>
                            <div className="flex mt-4">
                                <button onClick={() => handleAccept(appointment.id)} className="bg-green-500 text-white px-4 py-2 mr-2">Accept</button>
                                <button onClick={() => handleReject(appointment.id)} className="bg-red-500 text-white px-4 py-2 mr-2">Reject</button>
                                <button onClick={() => handleOfferAlternative(appointment.patientemailid)} className="bg-blue-500 text-white px-4 py-2">Offer Alternative</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
                    <div className="bg-white p-5 rounded-lg max-w-md mx-auto">
                        <h2 className="text-xl font-bold mb-4">Offer Alternative Appointment</h2>
                        <label htmlFor="newAppointmentDate" className="block mb-2">New Appointment Date:</label>
                        <input type="date" id="newAppointmentDate" value={newAppointmentDate} onChange={(e) => setNewAppointmentDate(e.target.value)} className="border border-gray-300 rounded-md mb-4 p-2 block w-full" />
                        <label htmlFor="patientEmail" className="block mb-2">Patient Email ID:</label>
                        <input type="email" id="patientEmail" value={patientEmail} disabled className="border border-gray-300 rounded-md mb-4 p-2 block w-full" />
                        <button className="bg-blue-500 text-white px-4 py-2 mr-2" onClick={handleSendMail}>Send Mail</button>
                        <button className="bg-gray-300 text-gray-700 px-4 py-2" onClick={handleModalClose}>Cancel</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PractitionerComponent;
