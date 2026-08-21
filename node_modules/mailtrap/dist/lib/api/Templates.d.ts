import { AxiosInstance } from "axios";
import TemplatesApi from "./resources/Templates";
export default class TemplatesBaseAPI {
    get: TemplatesApi["get"];
    getList: TemplatesApi["getList"];
    create: TemplatesApi["create"];
    update: TemplatesApi["update"];
    delete: TemplatesApi["delete"];
    constructor(client: AxiosInstance, accountId: number);
}
//# sourceMappingURL=Templates.d.ts.map