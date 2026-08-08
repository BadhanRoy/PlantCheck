import { AxiosInstance } from "axios";
import { ContactFieldOptions, ContactFieldResponse, ContactFieldsResponse } from "../../../types/api/contact-fields";
export default class ContactFieldsApi {
    private client;
    private contactFieldsURL;
    constructor(client: AxiosInstance, accountId: number);
    /**
     * Get all contact fields.
     */
    getList(): Promise<ContactFieldsResponse>;
    /**
     * Get a contact field by `fieldId`.
     */
    get(fieldId: number): Promise<ContactFieldResponse>;
    /**
     * Creates a new contact field.
     */
    create(data: ContactFieldOptions): Promise<ContactFieldResponse>;
    /**
     * Updates an existing contact field by `fieldId`.
     */
    update(fieldId: number, data: ContactFieldOptions): Promise<ContactFieldResponse>;
    /**
     * Deletes a contact field by ID.
     */
    delete(fieldId: number): Promise<import("axios").AxiosResponse<any, any, {}>>;
}
//# sourceMappingURL=ContactFields.d.ts.map