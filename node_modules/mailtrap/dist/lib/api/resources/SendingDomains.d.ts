import { AxiosInstance } from "axios";
import { CreateSendingDomainParams, SendingDomain, SendingDomainsResponse } from "../../../types/api/sending-domains";
export default class SendingDomainsApi {
    private client;
    private sendingDomainsURL;
    constructor(client: AxiosInstance, accountId: number);
    /**
     * Get a list of sending domains.
     * @returns Returns the list of sending domains for the account.
     */
    getList(): Promise<SendingDomainsResponse>;
    /**
     * Get a single sending domain by ID.
     * @param id Sending domain ID
     * @returns Returns a single sending domain
     */
    get(id: number): Promise<SendingDomain>;
    /**
     * Create a new sending domain.
     */
    create(params: CreateSendingDomainParams): Promise<SendingDomain>;
    /**
     * Delete a sending domain by ID.
     * @param id Sending domain ID
     */
    delete(id: number): Promise<import("axios").AxiosResponse<any, any, {}>>;
    /**
     * Send setup instructions for a sending domain to an email address.
     * @param id Sending domain ID
     * @param email Email address to send setup instructions to
     * @returns Returns a success message
     */
    sendSetupInstructions(id: number, email: string): Promise<import("axios").AxiosResponse<any, any, {}>>;
}
//# sourceMappingURL=SendingDomains.d.ts.map