import { AxiosInstance } from "axios";
import { Inbox, CreateInboxParams, UpdateInboxParams } from "../../../../types/api/inbound/inboxes";
export default class InboxesApi {
    private client;
    private foldersURL;
    constructor(client: AxiosInstance);
    private inboxesURL;
    /**
     * Get all inboxes in a folder.
     */
    getList(folderId: number): Promise<Inbox[]>;
    /**
     * Get a single inbox by ID.
     */
    get(folderId: number, inboxId: number): Promise<Inbox>;
    /**
     * Create a new inbox in a folder.
     */
    create(folderId: number, params: CreateInboxParams): Promise<Inbox>;
    /**
     * Update an inbox by ID.
     */
    update(folderId: number, inboxId: number, params: UpdateInboxParams): Promise<Inbox>;
    /**
     * Delete an inbox by ID.
     */
    delete(folderId: number, inboxId: number): Promise<import("axios").AxiosResponse<any, any, {}>>;
}
//# sourceMappingURL=Inboxes.d.ts.map