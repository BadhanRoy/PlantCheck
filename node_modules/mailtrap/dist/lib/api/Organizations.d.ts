import { AxiosInstance } from "axios";
import SubAccountsApi from "./resources/SubAccounts";
export default class OrganizationsBaseAPI {
    subAccounts: SubAccountsApi;
    constructor(client: AxiosInstance, organizationId: number);
}
//# sourceMappingURL=Organizations.d.ts.map