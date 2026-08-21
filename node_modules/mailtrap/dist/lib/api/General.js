"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const AccountAccesses_1 = __importDefault(require("./resources/AccountAccesses"));
const Accounts_1 = __importDefault(require("./resources/Accounts"));
const ApiTokens_1 = __importDefault(require("./resources/ApiTokens"));
const Billing_1 = __importDefault(require("./resources/Billing"));
const Permissions_1 = __importDefault(require("./resources/Permissions"));
class GeneralAPI {
    constructor(client, accountId) {
        this.accountId = null;
        this.accountAccessesInstance = null;
        this.permissionsInstance = null;
        this.billingInstance = null;
        this.apiTokensInstance = null;
        this.client = client;
        this.accountId = accountId ?? null;
        this.accounts = new Accounts_1.default(client);
        // Only instantiate account-specific APIs if accountId is provided
        if (this.accountId !== null) {
            this.accountAccessesInstance = new AccountAccesses_1.default(client, this.accountId);
            this.permissionsInstance = new Permissions_1.default(client, this.accountId);
        }
    }
    /**
     * Checks if the account ID is present.
     */
    checkAccountIdPresence() {
        if (this.accountId === null) {
            throw new Error("Account ID is required for this operation. Please provide accountId when creating GeneralAPI instance.");
        }
        return this.accountId;
    }
    /**
     * Singleton getter for Account Accesses API.
     */
    get accountAccesses() {
        if (this.accountAccessesInstance === null) {
            const accountId = this.checkAccountIdPresence();
            this.accountAccessesInstance = new AccountAccesses_1.default(this.client, accountId);
        }
        return this.accountAccessesInstance;
    }
    /**
     * Singleton getter for Permissions API.
     */
    get permissions() {
        if (this.permissionsInstance === null) {
            const accountId = this.checkAccountIdPresence();
            this.permissionsInstance = new Permissions_1.default(this.client, accountId);
        }
        return this.permissionsInstance;
    }
    /**
     * Singleton getter for Billing API.
     */
    get billing() {
        if (this.billingInstance === null) {
            const accountId = this.checkAccountIdPresence();
            this.billingInstance = new Billing_1.default(this.client, accountId);
        }
        return this.billingInstance;
    }
    /**
     * Singleton getter for API Tokens API.
     */
    get apiTokens() {
        if (this.apiTokensInstance === null) {
            const accountId = this.checkAccountIdPresence();
            this.apiTokensInstance = new ApiTokens_1.default(this.client, accountId);
        }
        return this.apiTokensInstance;
    }
}
exports.default = GeneralAPI;
