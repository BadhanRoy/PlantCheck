import { AxiosInstance } from "axios";
import { Folder, FolderParams } from "../../../../types/api/inbound/folders";
export default class FoldersApi {
    private client;
    private foldersURL;
    constructor(client: AxiosInstance);
    /**
     * Get all inbound folders in the account.
     */
    getList(): Promise<Folder[]>;
    /**
     * Get a single inbound folder by ID.
     */
    get(folderId: number): Promise<Folder>;
    /**
     * Create a new inbound folder.
     */
    create(params: FolderParams): Promise<Folder>;
    /**
     * Update an inbound folder by ID.
     */
    update(folderId: number, params: FolderParams): Promise<Folder>;
    /**
     * Delete an inbound folder by ID, along with all of its inboxes.
     */
    delete(folderId: number): Promise<import("axios").AxiosResponse<any, any, {}>>;
}
//# sourceMappingURL=Folders.d.ts.map