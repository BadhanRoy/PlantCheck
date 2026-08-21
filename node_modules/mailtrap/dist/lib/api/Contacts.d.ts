import { AxiosInstance } from "axios";
import ContactsApi from "./resources/Contacts";
export default class ContactsBaseAPI {
    get: ContactsApi["get"];
    create: ContactsApi["create"];
    update: ContactsApi["update"];
    delete: ContactsApi["delete"];
    constructor(client: AxiosInstance, accountId: number);
}
//# sourceMappingURL=Contacts.d.ts.map