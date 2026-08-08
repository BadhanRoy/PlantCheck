"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = __importDefault(require("../../../../config"));
const { CLIENT_SETTINGS } = config_1.default;
const { GENERAL_ENDPOINT } = CLIENT_SETTINGS;
class FoldersApi {
    constructor(client) {
        this.client = client;
        this.foldersURL = `${GENERAL_ENDPOINT}/api/inbound/folders`;
    }
    /**
     * Get all inbound folders in the account.
     */
    async getList() {
        return this.client.get(this.foldersURL);
    }
    /**
     * Get a single inbound folder by ID.
     */
    async get(folderId) {
        const url = `${this.foldersURL}/${folderId}`;
        return this.client.get(url);
    }
    /**
     * Create a new inbound folder.
     */
    async create(params) {
        return this.client.post(this.foldersURL, params);
    }
    /**
     * Update an inbound folder by ID.
     */
    async update(folderId, params) {
        const url = `${this.foldersURL}/${folderId}`;
        return this.client.patch(url, params);
    }
    /**
     * Delete an inbound folder by ID, along with all of its inboxes.
     */
    async delete(folderId) {
        const url = `${this.foldersURL}/${folderId}`;
        return this.client.delete(url);
    }
}
exports.default = FoldersApi;
