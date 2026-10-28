// Confirmed service calendars. Consultation calls do not reserve a course place.
export const SEVILLE_SESSION_URL =
  'https://calendly.com/adiestracaninos/sesion-presencial-en-sevilla';
export const TRAINING_CONSULTATION_URL =
  'https://calendly.com/adiestracaninos/asesoramiento-personalizado';
export const confirmedBookings: Record<string, string> = {
  intensiva: SEVILLE_SESSION_URL,
  online: TRAINING_CONSULTATION_URL,
  presencial: TRAINING_CONSULTATION_URL,
  'online-presencial': TRAINING_CONSULTATION_URL,
};
