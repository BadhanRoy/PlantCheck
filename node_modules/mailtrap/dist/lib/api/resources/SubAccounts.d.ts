import { AxiosInstance } from "axios";
import { CreateSubAccountParams, SubAccount } from "../../../types/api/sub-accounts";
export default class SubAccountsApi {
    private client;
    private subAccountsURL;
    constructor(client: AxiosInstance, organizationId: number);
    /**
     * Get a list of sub accounts for the organization. Requires sub-account
     * management permissions.
     */
    getList(): Promise<SubAccount[]>;
    /**
     * Create a new sub account under the organization. Requires sub-account
     * management permissions.
     */
    create(params: CreateSubAccountParams): Promise<SubAccount>;
}
//# sourceMappingURL=SubAccounts.d.ts.map