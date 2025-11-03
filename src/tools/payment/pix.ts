import axios from "axios";
import { v4 as uuidv4 } from 'uuid';



interface PixResponse {
  copiaEcola: string;
  qrCode: string;
  link: string;
}

export async function fetchPix(patientData: any, company: string, service: string, price: string | number): Promise<PixResponse> {
  try {
    const [first, ...last] = patientData.name.split(' ');
    const payload = {
      "transaction_amount": price as number,
      "description": `Pagamento via PIX para ${company}- Consulta médica - ${service}`,
      "patient_id": patientData.id,
      "payer": {
        "email": patientData.email,
        "first_name": first,
        "last_name": last.join(' '),
        "identification": {
          "type": "CPF",
          "number": patientData.cpf
        }
      },
      "external_reference": uuidv4(),
      "notification_url": "https://pagamento.suissa.dev/notifications"
    }
    console.log('[Tool:fetchPix] Payload:', payload);
    const response = await axios.post(`https://pagamento.suissa.dev/payment/pix`, 
      payload, {
      // headers: {
      //   Authorization: JWT
      // },
      timeout: 5000
    });
    console.log('[Tool:fetchPix] Response:', response.data);
    return {
      copiaEcola: response.data.qr_code,
      qrCode: response.data.qr_code_base64,
      link: response.data.ticket_url
    };
  } catch (error) {
    console.error('[Tool:fetchPix] Error:', error);
    throw new Error('Erro ao buscar pix');
  }
}
