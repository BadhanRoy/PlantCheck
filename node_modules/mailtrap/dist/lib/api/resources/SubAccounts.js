"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = __importDefault(require("../../../config"));
const { CLIENT_SETTINGS } = config_1.default;
const { GENERAL_ENDPOINT } = CLIENT_SETTINGS;
class SubAccountsApi {
    constructor(client, organizationId) {
        this.client = client;
        this.subAccountsURL = `${GENERAL_ENDPOINT}/api/organizations/${organizationId}/sub_accounts`;
    }
    /**
     * Get a list of sub accounts for the organization. Requires sub-account
     * management permissions.
     */
    async getList() {
        const url = this.subAccountsURL;
        return this.client.get(url);
    }
    /**
     * Create a new sub account under the organization. Requires sub-account
     * management permissions.
     */
    async create(params) {
        const url = this.subAccountsURL;
        const data = { account: params };
        return this.client.post(url, data);
    }
}
exports.default = SubAccountsApi;
