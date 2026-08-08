"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const SendingDomains_1 = __importDefault(require("./resources/SendingDomains"));
class SendingDomainsBaseAPI {
    constructor(client, accountId) {
        this.client = client;
        const sendingDomains = new SendingDomains_1.default(this.client, accountId);
        this.get = sendingDomains.get.bind(sendingDomains);
        this.getList = sendingDomains.getList.bind(sendingDomains);
        this.create = sendingDomains.create.bind(sendingDomains);
        this.delete = sendingDomains.delete.bind(sendingDomains);
        this.sendSetupInstructions =
            sendingDomains.sendSetupInstructions.bind(sendingDomains);
    }
}
exports.default = SendingDomainsBaseAPI;
