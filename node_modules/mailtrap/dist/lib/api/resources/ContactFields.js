"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = __importDefault(require("../../../config"));
const { CLIENT_SETTINGS } = config_1.default;
const { GENERAL_ENDPOINT } = CLIENT_SETTINGS;
class ContactFieldsApi {
    constructor(client, accountId) {
        this.client = client;
        this.contactFieldsURL = `${GENERAL_ENDPOINT}/api/accounts/${accountId}/contacts/fields`;
    }
    /**
     * Get all contact fields.
     */
    async getList() {
        const url = `${this.contactFieldsURL}`;
        return this.client.get(url);
    }
    /**
     * Get a contact field by `fieldId`.
     */
    async get(fieldId) {
        const url = `${this.contactFieldsURL}/${fieldId}`;
        return this.client.get(url);
    }
    /**
     * Creates a new contact field.
     */
    async create(data) {
        return this.client.post(this.contactFieldsURL, data);
    }
    /**
     * Updates an existing contact field by `fieldId`.
     */
    async update(fieldId, data) {
        const url = `${this.contactFieldsURL}/${fieldId}`;
        return this.client.patch(url, data);
    }
    /**
     * Deletes a contact field by ID.
     */
    async delete(fieldId) {
        const url = `${this.contactFieldsURL}/${fieldId}`;
        return this.client.delete(url);
    }
}
exports.default = ContactFieldsApi;
