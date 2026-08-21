import { AxiosInstance } from "axios";
import { ContactImportResponse, ImportContactsRequest } from "../../../types/api/contact-imports";
export default class ContactImportsApi {
    private client;
    private contactImportsURL;
    constructor(client: AxiosInstance, accountId: number);
    /**
     * Get a contact import by `importId`.
     */
    get(importId: number): Promise<ContactImportResponse>;
    /**
     * Import contacts.
     */
    create(data: ImportContactsRequest): Promise<ContactImportResponse>;
}
//# sourceMappingURL=ContactImports.d.ts.map