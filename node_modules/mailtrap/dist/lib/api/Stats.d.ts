import { AxiosInstance } from "axios";
import StatsApi from "./resources/Stats";
export default class StatsBaseAPI {
    get: StatsApi["get"];
    byDomain: StatsApi["byDomain"];
    byCategory: StatsApi["byCategory"];
    byEmailServiceProvider: StatsApi["byEmailServiceProvider"];
    byDate: StatsApi["byDate"];
    constructor(client: AxiosInstance, accountId: number);
}
//# sourceMappingURL=Stats.d.ts.map