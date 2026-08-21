"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Folders_1 = __importDefault(require("./resources/inbound/Folders"));
const Inboxes_1 = __importDefault(require("./resources/inbound/Inboxes"));
const Messages_1 = __importDefault(require("./resources/inbound/Messages"));
const Threads_1 = __importDefault(require("./resources/inbound/Threads"));
class InboundAPI {
    constructor(client) {
        this.folders = new Folders_1.default(client);
        this.inboxes = new Inboxes_1.default(client);
        this.messages = new Messages_1.default(client);
        this.threads = new Threads_1.default(client);
    }
}
exports.default = InboundAPI;
