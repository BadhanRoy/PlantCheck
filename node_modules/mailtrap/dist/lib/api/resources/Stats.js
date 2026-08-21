"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = __importDefault(require("../../../config"));
const { CLIENT_SETTINGS } = config_1.default;
const { GENERAL_ENDPOINT } = CLIENT_SETTINGS;
const GROUP_KEYS = {
    domains: "sending_domain_id",
    categories: "category",
    email_service_providers: "email_service_provider",
    date: "date",
};
class StatsApi {
    constructor(client, accountId) {
        this.client = client;
        this.statsURL = `${GENERAL_ENDPOINT}/api/accounts/${accountId}/stats`;
    }
    /**
     * Get aggregated sending stats.
     */
    async get(params) {
        const url = this.statsURL;
        return this.client.get(url, {
            params: StatsApi.buildQueryParams(params),
        });
    }
    /**
     * Get sending stats grouped by domain.
     */
    async byDomain(params) {
        return this.groupedStats("domains", params);
    }
    /**
     * Get sending stats grouped by category.
     */
    async byCategory(params) {
        return this.groupedStats("categories", params);
    }
    /**
     * Get sending stats grouped by email service provider.
     */
    async byEmailServiceProvider(params) {
        return this.groupedStats("email_service_providers", params);
    }
    /**
     * Get sending stats grouped by date.
     */
    async byDate(params) {
        return this.groupedStats("date", params);
    }
    async groupedStats(group, params) {
        const url = `${this.statsURL}/${group}`;
        const groupKey = GROUP_KEYS[group];
        if (!groupKey) {
            throw new Error(`Unknown stats group: ${group}`);
        }
        const response = await this.client.get(url, {
            params: StatsApi.buildQueryParams(params),
        });
        return response.map((item) => ({
            name: groupKey,
            value: item[groupKey],
            stats: item.stats,
        }));
    }
    static buildQueryParams(params) {
        const query = {
            start_date: params.start_date,
            end_date: params.end_date,
        };
        if (params.sending_domain_ids) {
            query.sending_domain_ids = params.sending_domain_ids;
        }
        if (params.sending_streams) {
            query.sending_streams = params.sending_streams;
        }
        if (params.categories) {
            query.categories = params.categories;
        }
        if (params.email_service_providers) {
            query.email_service_providers = params.email_service_providers;
        }
        return query;
    }
}
exports.default = StatsApi;
