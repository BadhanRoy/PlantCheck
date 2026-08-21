"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const EmailLogs_1 = __importDefault(require("./resources/EmailLogs"));
class EmailLogsBaseAPI {
    constructor(client, accountId) {
        const emailLogs = new EmailLogs_1.default(client, accountId);
        this.getList = emailLogs.getList.bind(emailLogs);
        this.get = emailLogs.get.bind(emailLogs);
    }
}
exports.default = EmailLogsBaseAPI;
