
export async function fetchPatientAppointments(phone: string): Promise<ExistingAppointment[]> {
  try {
    console.log('[schedule_new] Fetching appointments for patient phone:', phone);
    
    const response = await axios.get(`http://localhost:3001/patients/phone/${phone}/appointments`, {
      headers: {
        Authorization: JWT
      },
      timeout: 5000
    });
    
    if (response.data && response.data.appointments && Array.isArray(response.data.appointments)) {
      // Filter appointments that are scheduled or confirmed
      const patientAppointments = response.data.appointments
        .filter((appointment: any) => 
          appointment.status === 'scheduled' || appointment.status === 'confirmed'
        )
        .map((appointment: any) => ({
          id: appointment.id,
          day: appointment.day,
          initDate: appointment.initDate,
          endDate: appointment.endDate,
          title: appointment.title,
          status: appointment.status,
          dentistName: appointment.responsibleName || 'Profissional',
          dentistId: appointment.responsibleId
        }));
      
      console.log('[schedule_new] Found', patientAppointments.length, 'appointments for patient');
      return patientAppointments;
    }
    
    console.log('[schedule_new] No appointments found for patient');
    return [];
  } catch (error) {
    console.error('[Tool:fetchPatientAppointments] Error:', error);
    return []; // Return empty array on error
  }
}