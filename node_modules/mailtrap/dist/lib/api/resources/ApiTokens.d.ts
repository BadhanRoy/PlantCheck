import { AxiosInstance } from "axios";
import { ApiToken, ApiTokenWithToken, CreateApiTokenRequest } from "../../../types/api/api-tokens";
export default class ApiTokensApi {
    private client;
    private apiTokensURL;
    constructor(client: AxiosInstance, accountId: number);
    /**
     * List all API tokens visible to the current API token.
     * The full token value is never returned here — only `last_4_digits`.
     */
    getList(): Promise<ApiToken[]>;
    /**
     * Create a new API token for the account with the given name and resource permissions.
     * The full token value is returned only in the response of this call — store it securely.
     */
    create(params: CreateApiTokenRequest): Promise<ApiTokenWithToken>;
    /**
     * Get a single API token by ID. The full token value is not returned —
     * only `last_4_digits` is available outside of create/reset responses.
     */
    get(id: number): Promise<ApiToken>;
    /**
     * Reset an API token: expires the existing token and returns a new one with
     * the same permissions. The new token value is returned only in this response —
     * store it securely. Only tokens that have not already been reset can be reset.
     */
    reset(id: number): Promise<ApiTokenWithToken>;
    /**
     * Permanently delete an API token by ID.
     */
    delete(id: number): Promise<import("axios").AxiosResponse<any, any, {}>>;
}
//# sourceMappingURL=ApiTokens.d.ts.map