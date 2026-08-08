import { AxiosInstance } from "axios";
import SendingDomainsApi from "./resources/SendingDomains";
export default class SendingDomainsBaseAPI {
    private client;
    get: SendingDomainsApi["get"];
    getList: SendingDomainsApi["getList"];
    create: SendingDomainsApi["create"];
    delete: SendingDomainsApi["delete"];
    sendSetupInstructions: SendingDomainsApi["sendSetupInstructions"];
    constructor(client: AxiosInstance, accountId: number);
}
//# sourceMappingURL=SendingDomains.d.ts.map