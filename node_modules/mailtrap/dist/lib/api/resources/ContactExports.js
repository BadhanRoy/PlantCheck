"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = __importDefault(require("../../../config"));
const { CLIENT_SETTINGS } = config_1.default;
const { GENERAL_ENDPOINT } = CLIENT_SETTINGS;
class ContactExportsApi {
    constructor(client, accountId) {
        this.client = client;
        this.contactExportsURL = `${GENERAL_ENDPOINT}/api/accounts/${accountId}/contacts/exports`;
    }
    /**
     * Get a contact export by `exportId`.
     */
    async get(exportId) {
        const url = `${this.contactExportsURL}/${exportId}`;
        return this.client.get(url);
    }
    /**
     * Export contacts.
     */
    async create(params) {
        const url = `${this.contactExportsURL}`;
        return this.client.post(url, params);
    }
}
exports.default = ContactExportsApi;
