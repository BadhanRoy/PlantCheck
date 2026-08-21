"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = __importDefault(require("../../../config"));
const { CLIENT_SETTINGS } = config_1.default;
const { GENERAL_ENDPOINT } = CLIENT_SETTINGS;
class ContactEventsApi {
    constructor(client, accountId) {
        this.client = client;
        this.contactsURL = `${GENERAL_ENDPOINT}/api/accounts/${accountId}/contacts`;
    }
    /**
     * Creates a new contact event for given contact identifier and data.
     */
    async create(contactIdentifier, data) {
        const url = `${this.contactsURL}/${contactIdentifier}/events`;
        return this.client.post(url, data);
    }
}
exports.default = ContactEventsApi;
