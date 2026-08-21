"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ContactExports_1 = __importDefault(require("./resources/ContactExports"));
class ContactExportsBaseAPI {
    constructor(client, accountId) {
        const contactExports = new ContactExports_1.default(client, accountId);
        this.create = contactExports.create.bind(contactExports);
        this.get = contactExports.get.bind(contactExports);
    }
}
exports.default = ContactExportsBaseAPI;
