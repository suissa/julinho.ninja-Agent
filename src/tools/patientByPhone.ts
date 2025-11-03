export async function getPatientIdByPhone(phone: string): Promise<string> {
  try {

    const response = await axios.get(`http://localhost:3001/patients/phone/${phone}`, {
      headers: {
        Authorization: JWT
      },
      timeout: 5000
    });
    console.log('[Tool:getPatientIdByPhone] Response:', response.data);
    return response.data.id;
  } catch (error) {
    console.error('[Tool:getPatientIdByPhone] Error:', error);
    throw new Error('Erro ao buscar id do paciente');
  }
}
