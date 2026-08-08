"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = __importDefault(require("../../../config"));
const { CLIENT_SETTINGS } = config_1.default;
const { GENERAL_ENDPOINT } = CLIENT_SETTINGS;
class BillingApi {
    constructor(client, accountId) {
        this.client = client;
        this.billingURL = `${GENERAL_ENDPOINT}/api/accounts/${accountId}/billing/usage`;
    }
    /**
     * Get billing usage for the account.
     */
    async getCurrentBillingCycleUsage() {
        const url = this.billingURL;
        return this.client.get(url);
    }
}
exports.default = BillingApi;
