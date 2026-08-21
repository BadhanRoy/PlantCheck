import { AxiosInstance } from "axios";
import ContactListsApi from "./resources/ContactLists";
export default class ContactListsBaseAPI {
    create: ContactListsApi["create"];
    get: ContactListsApi["get"];
    getList: ContactListsApi["getList"];
    update: ContactListsApi["update"];
    delete: ContactListsApi["delete"];
    constructor(client: AxiosInstance, accountId: number);
}
//# sourceMappingURL=ContactLists.d.ts.map