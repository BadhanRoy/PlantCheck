import { AxiosInstance } from "axios";
import AccountAccessesApi from "./resources/AccountAccesses";
import AccountsApi from "./resources/Accounts";
import ApiTokensApi from "./resources/ApiTokens";
import BillingApi from "./resources/Billing";
import PermissionsApi from "./resources/Permissions";
export default class GeneralAPI {
    accounts: AccountsApi;
    private client;
    private accountId;
    private accountAccessesInstance;
    private permissionsInstance;
    private billingInstance;
    private apiTokensInstance;
    constructor(client: AxiosInstance, accountId?: number);
    /**
     * Checks if the account ID is present.
     */
    private checkAccountIdPresence;
    /**
     * Singleton getter for Account Accesses API.
     */
    get accountAccesses(): AccountAccessesApi;
    /**
     * Singleton getter for Permissions API.
     */
    get permissions(): PermissionsApi;
    /**
     * Singleton getter for Billing API.
     */
    get billing(): BillingApi;
    /**
     * Singleton getter for API Tokens API.
     */
    get apiTokens(): ApiTokensApi;
}
//# sourceMappingURL=General.d.ts.map