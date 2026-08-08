import { AxiosInstance } from "axios";
import ContactImportsApi from "./resources/ContactImports";
export default class ContactImportsBaseAPI {
    create: ContactImportsApi["create"];
    get: ContactImportsApi["get"];
    constructor(client: AxiosInstance, accountId: number);
}
//# sourceMappingURL=ContactImports.d.ts.map