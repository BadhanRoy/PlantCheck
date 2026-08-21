import { AxiosInstance } from "axios";
import EmailLogsApi from "./resources/EmailLogs";
export default class EmailLogsBaseAPI {
    getList: EmailLogsApi["getList"];
    get: EmailLogsApi["get"];
    constructor(client: AxiosInstance, accountId: number);
}
//# sourceMappingURL=EmailLogs.d.ts.map