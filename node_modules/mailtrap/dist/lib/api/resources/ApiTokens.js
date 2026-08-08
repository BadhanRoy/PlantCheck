"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = __importDefault(require("../../../config"));
const { CLIENT_SETTINGS } = config_1.default;
const { GENERAL_ENDPOINT } = CLIENT_SETTINGS;
class ApiTokensApi {
    constructor(client, accountId) {
        this.client = client;
        this.apiTokensURL = `${GENERAL_ENDPOINT}/api/accounts/${accountId}/api_tokens`;
    }
    /**
     * List all API tokens visible to the current API token.
     * The full token value is never returned here — only `last_4_digits`.
     */
    async getList() {
        const url = this.apiTokensURL;
        return this.client.get(url);
    }
    /**
     * Create a new API token for the account with the given name and resource permissions.
     * The full token value is returned only in the response of this call — store it securely.
     */
    async create(params) {
        const url = this.apiTokensURL;
        return this.client.post(url, params);
    }
    /**
     * Get a single API token by ID. The full token value is not returned —
     * only `last_4_digits` is available outside of create/reset responses.
     */
    async get(id) {
        const url = `${this.apiTokensURL}/${id}`;
        return this.client.get(url);
    }
    /**
     * Reset an API token: expires the existing token and returns a new one with
     * the same permissions. The new token value is returned only in this response —
     * store it securely. Only tokens that have not already been reset can be reset.
     */
    async reset(id) {
        const url = `${this.apiTokensURL}/${id}/reset`;
        return this.client.post(url);
    }
    /**
     * Permanently delete an API token by ID.
     */
    async delete(id) {
        const url = `${this.apiTokensURL}/${id}`;
        return this.client.delete(url);
    }
}
exports.default = ApiTokensApi;
