"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = __importDefault(require("../../../config"));
const { CLIENT_SETTINGS } = config_1.default;
const { GENERAL_ENDPOINT } = CLIENT_SETTINGS;
class ContactImportsApi {
    constructor(client, accountId) {
        this.client = client;
        this.contactImportsURL = `${GENERAL_ENDPOINT}/api/accounts/${accountId}/contacts/imports`;
    }
    /**
     * Get a contact import by `importId`.
     */
    async get(importId) {
        const url = `${this.contactImportsURL}/${importId}`;
        return this.client.get(url);
    }
    /**
     * Import contacts.
     */
    async create(data) {
        const url = `${this.contactImportsURL}`;
        return this.client.post(url, data);
    }
}
exports.default = ContactImportsApi;
