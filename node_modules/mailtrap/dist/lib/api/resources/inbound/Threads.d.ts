import { AxiosInstance } from "axios";
import { Thread, ThreadsListResponse, ThreadsListParams } from "../../../../types/api/inbound/threads";
export default class ThreadsApi {
    private client;
    private inboxesURL;
    constructor(client: AxiosInstance);
    private threadsURL;
    /**
     * List threads in an inbox (paginated). Pass `last_id` from the previous
     * response to fetch the next page.
     */
    getList(inboxId: number, params?: ThreadsListParams): Promise<ThreadsListResponse>;
    /**
     * Get a single thread with its messages embedded (oldest first).
     */
    get(inboxId: number, threadId: string): Promise<Thread>;
    /**
     * Delete a thread by ID.
     */
    delete(inboxId: number, threadId: string): Promise<import("axios").AxiosResponse<any, any, {}>>;
}
//# sourceMappingURL=Threads.d.ts.map