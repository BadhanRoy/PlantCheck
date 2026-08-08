import { AxiosInstance } from "axios";
import ContactEventsApi from "./resources/ContactEvents";
export default class ContactEventsBaseAPI {
    create: ContactEventsApi["create"];
    constructor(client: AxiosInstance, accountId: number);
}
//# sourceMappingURL=ContactEvents.d.ts.map