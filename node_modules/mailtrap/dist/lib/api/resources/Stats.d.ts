import { AxiosInstance } from "axios";
import { SendingStatGroup, SendingStats, StatsFilterParams } from "../../../types/api/stats";
export default class StatsApi {
    private client;
    private statsURL;
    constructor(client: AxiosInstance, accountId: number);
    /**
     * Get aggregated sending stats.
     */
    get(params: StatsFilterParams): Promise<SendingStats>;
    /**
     * Get sending stats grouped by domain.
     */
    byDomain(params: StatsFilterParams): Promise<SendingStatGroup[]>;
    /**
     * Get sending stats grouped by category.
     */
    byCategory(params: StatsFilterParams): Promise<SendingStatGroup[]>;
    /**
     * Get sending stats grouped by email service provider.
     */
    byEmailServiceProvider(params: StatsFilterParams): Promise<SendingStatGroup[]>;
    /**
     * Get sending stats grouped by date.
     */
    byDate(params: StatsFilterParams): Promise<SendingStatGroup[]>;
    private groupedStats;
    private static buildQueryParams;
}
//# sourceMappingURL=Stats.d.ts.map