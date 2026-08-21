"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = __importDefault(require("../../../config"));
const { CLIENT_SETTINGS } = config_1.default;
const { GENERAL_ENDPOINT } = CLIENT_SETTINGS;
class ContactListsApi {
    constructor(client, accountId) {
        this.client = client;
        this.contactListsURL = `${GENERAL_ENDPOINT}/api/accounts/${accountId}/contacts/lists`;
    }
    /**
     * Get all contact lists. Optionally filter by name via a case-insensitive
     * prefix match with `search`.
     */
    async getList(options) {
        const params = {
            ...(options?.search && { search: options.search }),
        };
        return this.client.get(this.contactListsURL, {
            params,
        });
    }
    /**
     * Get a contact list by `listId`.
     */
    async get(listId) {
        const url = `${this.contactListsURL}/${listId}`;
        return this.client.get(url);
    }
    /**
     * Creates a new contact list.
     */
    async create(data) {
        return this.client.post(this.contactListsURL, data);
    }
    /**
     * Updates an existing contact list by `listId`.
     */
    async update(listId, data) {
        const url = `${this.contactListsURL}/${listId}`;
        return this.client.patch(url, data);
    }
    /**
     * Deletes a contact list by ID.
     */
    async delete(listId) {
        const url = `${this.contactListsURL}/${listId}`;
        return this.client.delete(url);
    }
}
exports.default = ContactListsApi;
