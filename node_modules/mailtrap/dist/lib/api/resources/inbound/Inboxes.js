"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = __importDefault(require("../../../../config"));
const { CLIENT_SETTINGS } = config_1.default;
const { GENERAL_ENDPOINT } = CLIENT_SETTINGS;
class InboxesApi {
    constructor(client) {
        this.client = client;
        this.foldersURL = `${GENERAL_ENDPOINT}/api/inbound/folders`;
    }
    inboxesURL(folderId) {
        return `${this.foldersURL}/${folderId}/inboxes`;
    }
    /**
     * Get all inboxes in a folder.
     */
    async getList(folderId) {
        return this.client.get(this.inboxesURL(folderId));
    }
    /**
     * Get a single inbox by ID.
     */
    async get(folderId, inboxId) {
        const url = `${this.inboxesURL(folderId)}/${inboxId}`;
        return this.client.get(url);
    }
    /**
     * Create a new inbox in a folder.
     */
    async create(folderId, params) {
        return this.client.post(this.inboxesURL(folderId), params);
    }
    /**
     * Update an inbox by ID.
     */
    async update(folderId, inboxId, params) {
        const url = `${this.inboxesURL(folderId)}/${inboxId}`;
        return this.client.patch(url, params);
    }
    /**
     * Delete an inbox by ID.
     */
    async delete(folderId, inboxId) {
        const url = `${this.inboxesURL(folderId)}/${inboxId}`;
        return this.client.delete(url);
    }
}
exports.default = InboxesApi;
