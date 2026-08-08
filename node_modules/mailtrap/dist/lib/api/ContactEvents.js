"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ContactEvents_1 = __importDefault(require("./resources/ContactEvents"));
class ContactEventsBaseAPI {
    constructor(client, accountId) {
        const contactEvents = new ContactEvents_1.default(client, accountId);
        this.create = contactEvents.create.bind(contactEvents);
    }
}
exports.default = ContactEventsBaseAPI;
