import { AxiosInstance } from "axios";
import { BillingCycleUsage } from "../../../types/api/billing";
export default class BillingApi {
    private client;
    private billingURL;
    constructor(client: AxiosInstance, accountId: number);
    /**
     * Get billing usage for the account.
     */
    getCurrentBillingCycleUsage(): Promise<BillingCycleUsage>;
}
//# sourceMappingURL=Billing.d.ts.map