"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Webhooks_1 = __importDefault(require("./resources/Webhooks"));
class WebhooksBaseAPI {
    constructor(client, accountId) {
        this.client = client;
        const webhooks = new Webhooks_1.default(this.client, accountId);
        this.getList = webhooks.getList.bind(webhooks);
        this.create = webhooks.create.bind(webhooks);
        this.get = webhooks.get.bind(webhooks);
        this.update = webhooks.update.bind(webhooks);
        this.delete = webhooks.delete.bind(webhooks);
    }
}
exports.default = WebhooksBaseAPI;
