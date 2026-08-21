"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = __importDefault(require("../../../../config"));
const { CLIENT_SETTINGS } = config_1.default;
const { GENERAL_ENDPOINT } = CLIENT_SETTINGS;
class ThreadsApi {
    constructor(client) {
        this.client = client;
        this.inboxesURL = `${GENERAL_ENDPOINT}/api/inbound/inboxes`;
    }
    threadsURL(inboxId) {
        return `${this.inboxesURL}/${inboxId}/threads`;
    }
    /**
     * List threads in an inbox (paginated). Pass `last_id` from the previous
     * response to fetch the next page.
     */
    async getList(inboxId, params) {
        const url = params?.last_id
            ? `${this.threadsURL(inboxId)}?last_id=${encodeURIComponent(params.last_id)}`
            : this.threadsURL(inboxId);
        return this.client.get(url);
    }
    /**
     * Get a single thread with its messages embedded (oldest first).
     */
    async get(inboxId, threadId) {
        const url = `${this.threadsURL(inboxId)}/${threadId}`;
        return this.client.get(url);
    }
    /**
     * Delete a thread by ID.
     */
    async delete(inboxId, threadId) {
        const url = `${this.threadsURL(inboxId)}/${threadId}`;
        return this.client.delete(url);
    }
}
exports.default = ThreadsApi;
