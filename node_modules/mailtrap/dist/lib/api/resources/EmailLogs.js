"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const qs_1 = __importDefault(require("qs"));
const config_1 = __importDefault(require("../../../config"));
const { CLIENT_SETTINGS } = config_1.default;
const { GENERAL_ENDPOINT } = CLIENT_SETTINGS;
/**
 * Serialize query params for email logs list. Uses qs for deepObject-style
 * bracket notation (e.g. filters[sent_after]=..., filters[to][operator]=...)
 * with bracket notation for arrays (Rails-style, e.g. filters[category][value][]=foo).
 */
function serializeEmailLogsParams(params) {
    const query = {};
    if (params.search_after != null) {
        query.search_after = params.search_after;
    }
    if (params.filters && typeof params.filters === "object") {
        query.filters = params.filters;
    }
    return qs_1.default.stringify(query, {
        arrayFormat: "brackets",
        encode: true,
        encodeValuesOnly: true,
    });
}
class EmailLogsApi {
    constructor(client, accountId) {
        this.client = client;
        this.emailLogsURL = `${GENERAL_ENDPOINT}/api/accounts/${accountId}/email_logs`;
    }
    /**
     * List email logs (paginated). Results are ordered by sent_at descending.
     * Use search_after with next_page_cursor from the previous response for the next page.
     */
    async getList(params) {
        const url = params && (params.search_after || params.filters)
            ? `${this.emailLogsURL}?${serializeEmailLogsParams(params)}`
            : this.emailLogsURL;
        return this.client.get(url);
    }
    /**
     * Get a single email log message by message ID.
     */
    async get(sendingMessageId) {
        const url = `${this.emailLogsURL}/${sendingMessageId}`;
        return this.client.get(url);
    }
}
exports.default = EmailLogsApi;
