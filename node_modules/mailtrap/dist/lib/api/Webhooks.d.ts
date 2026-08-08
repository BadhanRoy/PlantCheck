import { AxiosInstance } from "axios";
import WebhooksApi from "./resources/Webhooks";
export default class WebhooksBaseAPI {
    private client;
    getList: WebhooksApi["getList"];
    create: WebhooksApi["create"];
    get: WebhooksApi["get"];
    update: WebhooksApi["update"];
    delete: WebhooksApi["delete"];
    constructor(client: AxiosInstance, accountId: number);
}
//# sourceMappingURL=Webhooks.d.ts.map