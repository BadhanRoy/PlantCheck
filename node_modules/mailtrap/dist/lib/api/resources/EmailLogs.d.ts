import { AxiosInstance } from "axios";
import { EmailLogsList, EmailLogsListParams, EmailLogMessageDetails } from "../../../types/api/email-logs";
export default class EmailLogsApi {
    private client;
    private emailLogsURL;
    constructor(client: AxiosInstance, accountId: number);
    /**
     * List email logs (paginated). Results are ordered by sent_at descending.
     * Use search_after with next_page_cursor from the previous response for the next page.
     */
    getList(params?: EmailLogsListParams): Promise<EmailLogsList>;
    /**
     * Get a single email log message by message ID.
     */
    get(sendingMessageId: string): Promise<EmailLogMessageDetails>;
}
//# sourceMappingURL=EmailLogs.d.ts.map