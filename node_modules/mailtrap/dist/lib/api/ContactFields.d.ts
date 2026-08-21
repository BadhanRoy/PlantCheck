import { AxiosInstance } from "axios";
import ContactFieldsApi from "./resources/ContactFields";
export default class ContactFieldsBaseAPI {
    create: ContactFieldsApi["create"];
    get: ContactFieldsApi["get"];
    getList: ContactFieldsApi["getList"];
    update: ContactFieldsApi["update"];
    delete: ContactFieldsApi["delete"];
    constructor(client: AxiosInstance, accountId: number);
}
//# sourceMappingURL=ContactFields.d.ts.map