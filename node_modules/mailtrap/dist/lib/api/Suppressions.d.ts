import { AxiosInstance } from "axios";
import SuppressionsApi from "./resources/Suppressions";
export default class SuppressionsBaseAPI {
    getList: SuppressionsApi["getList"];
    delete: SuppressionsApi["delete"];
    constructor(client: AxiosInstance, accountId: number);
}
//# sourceMappingURL=Suppressions.d.ts.map