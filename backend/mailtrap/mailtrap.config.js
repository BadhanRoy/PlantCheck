import { MailtrapClient } from "mailtrap";
import dotenv from "dotenv";

dotenv.config();

export const mailtrapClient = new MailtrapClient({
    endpoint: "https://send.api.mailtrap.io",
    token: "542c707fb342e1b35bf113e509f12953",
});

export const sender = {
    email: "mailtrap@demomailtrap.com",
    name: "PlantCheck",
};