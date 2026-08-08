import { AxiosInstance } from "axios";
import { ContactEventOptions, ContactEventResponse } from "../../../types/api/contact-events";
export default class ContactEventsApi {
    private client;
    private contactsURL;
    constructor(client: AxiosInstance, accountId: number);
    /**
     * Creates a new contact event for given contact identifier and data.
     */
    create(contactIdentifier: number | string, data: ContactEventOptions): Promise<ContactEventResponse>;
}
//# sourceMappingURL=ContactEvents.d.ts.map