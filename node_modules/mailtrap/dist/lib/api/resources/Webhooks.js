"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = __importDefault(require("../../../config"));
const { CLIENT_SETTINGS } = config_1.default;
const { GENERAL_ENDPOINT } = CLIENT_SETTINGS;
class WebhooksApi {
    constructor(client, accountId) {
        this.client = client;
        this.webhooksURL = `${GENERAL_ENDPOINT}/api/accounts/${accountId}/webhooks`;
    }
    /**
     * Returns all webhooks for the account.
     */
    async getList() {
        const url = this.webhooksURL;
        return this.client.get(url);
    }
    /**
     * Create a new webhook for the account. The response includes a
     * `signing_secret` that is used to verify webhook payload signatures —
     * it is only returned on creation, store it securely.
     */
    async create(params) {
        const url = this.webhooksURL;
        const data = { webhook: params };
        return this.client.post(url, data);
    }
    /**
     * Get a single webhook by ID. The `signing_secret` is not returned here —
     * it is only available in the create response.
     */
    async get(id) {
        const url = `${this.webhooksURL}/${id}`;
        return this.client.get(url);
    }
    /**
     * Update an existing webhook. Only `url`, `active`, `payload_format`,
     * `event_types`, and `inbound_inbox_id` can be changed; `webhook_type`,
     * `sending_stream`, and `domain_id` are immutable after creation.
     */
    async update(id, params) {
        const url = `${this.webhooksURL}/${id}`;
        const data = { webhook: params };
        return this.client.patch(url, data);
    }
    /**
     * Permanently delete a webhook by ID. The deleted webhook is returned in
     * the response.
     */
    async delete(id) {
        const url = `${this.webhooksURL}/${id}`;
        return this.client.delete(url);
    }
}
exports.default = WebhooksApi;
