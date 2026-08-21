"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = __importDefault(require("../../../config"));
const { CLIENT_SETTINGS } = config_1.default;
const { GENERAL_ENDPOINT } = CLIENT_SETTINGS;
class SendingDomainsApi {
    constructor(client, accountId) {
        this.client = client;
        this.sendingDomainsURL = `${GENERAL_ENDPOINT}/api/accounts/${accountId}/sending_domains`;
    }
    /**
     * Get a list of sending domains.
     * @returns Returns the list of sending domains for the account.
     */
    async getList() {
        const url = this.sendingDomainsURL;
        return this.client.get(url);
    }
    /**
     * Get a single sending domain by ID.
     * @param id Sending domain ID
     * @returns Returns a single sending domain
     */
    async get(id) {
        const url = `${this.sendingDomainsURL}/${id}`;
        return this.client.get(url);
    }
    /**
     * Create a new sending domain.
     */
    async create(params) {
        const url = this.sendingDomainsURL;
        const data = { sending_domain: params };
        return this.client.post(url, data);
    }
    /**
     * Delete a sending domain by ID.
     * @param id Sending domain ID
     */
    async delete(id) {
        const url = `${this.sendingDomainsURL}/${id}`;
        return this.client.delete(url);
    }
    /**
     * Send setup instructions for a sending domain to an email address.
     * @param id Sending domain ID
     * @param email Email address to send setup instructions to
     * @returns Returns a success message
     */
    async sendSetupInstructions(id, email) {
        const url = `${this.sendingDomainsURL}/${id}/send_setup_instructions`;
        return this.client.post(url, { email });
    }
}
exports.default = SendingDomainsApi;
