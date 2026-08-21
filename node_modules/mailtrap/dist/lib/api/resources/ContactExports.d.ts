import { AxiosInstance } from "axios";
import { ContactExportResponse, CreateContactExportParams } from "../../../types/api/contact-exports";
export default class ContactExportsApi {
    private client;
    private contactExportsURL;
    constructor(client: AxiosInstance, accountId: number);
    /**
     * Get a contact export by `exportId`.
     */
    get(exportId: number): Promise<ContactExportResponse>;
    /**
     * Export contacts.
     */
    create(params: CreateContactExportParams): Promise<ContactExportResponse>;
}
//# sourceMappingURL=ContactExports.d.ts.map