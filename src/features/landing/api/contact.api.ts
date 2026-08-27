import axios from "axios";

export type ContactPayload = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

const CONTACT_API_URL =
  process.env.NEXT_PUBLIC_CONTACT_API_URL ?? "https://hasab.co/api/contact";

export async function submitContactForm(data: ContactPayload) {
  const response = await axios.post(CONTACT_API_URL, data);
  return response.data as { message?: string };
}
