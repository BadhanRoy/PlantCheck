"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = __importDefault(require("../../../../config"));
const { CLIENT_SETTINGS } = config_1.default;
const { GENERAL_ENDPOINT } = CLIENT_SETTINGS;
class MessagesApi {
    constructor(client) {
        this.client = client;
        this.inboxesURL = `${GENERAL_ENDPOINT}/api/inbound/inboxes`;
    }
    messagesURL(inboxId) {
        return `${this.inboxesURL}/${inboxId}/messages`;
    }
    /**
     * List messages in an inbox (paginated). Pass `last_id` from the previous
     * response to fetch the next page.
     */
    async getList(inboxId, params) {
        const url = params?.last_id
            ? `${this.messagesURL(inboxId)}?last_id=${encodeURIComponent(params.last_id)}`
            : this.messagesURL(inboxId);
        return this.client.get(url);
    }
    /**
     * Get a single message with its full body and attachment download URLs.
     */
    async get(inboxId, messageId) {
        const url = `${this.messagesURL(inboxId)}/${messageId}`;
        return this.client.get(url);
    }
    /**
     * Delete a message by ID.
     */
    async delete(inboxId, messageId) {
        const url = `${this.messagesURL(inboxId)}/${messageId}`;
        return this.client.delete(url);
    }
    /**
     * Reply to a message. Sends to the original sender.
     */
    async reply(inboxId, messageId, params) {
        const url = `${this.messagesURL(inboxId)}/${messageId}/reply`;
        return this.client.post(url, params);
    }
    /**
     * Reply to a message and copy the original's other recipients.
     */
    async replyAll(inboxId, messageId, params) {
        const url = `${this.messagesURL(inboxId)}/${messageId}/reply_all`;
        return this.client.post(url, params);
    }
    /**
     * Forward a message to new recipients (at least one `to` is required).
     */
    async forward(inboxId, messageId, params) {
        const url = `${this.messagesURL(inboxId)}/${messageId}/forward`;
        return this.client.post(url, params);
    }
}
exports.default = MessagesApi;
