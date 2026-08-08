import { AxiosInstance } from "axios";
import ContactExportsApi from "./resources/ContactExports";
export default class ContactExportsBaseAPI {
    create: ContactExportsApi["create"];
    get: ContactExportsApi["get"];
    constructor(client: AxiosInstance, accountId: number);
}
//# sourceMappingURL=ContactExports.d.ts.map