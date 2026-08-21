"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ContactImports_1 = __importDefault(require("./resources/ContactImports"));
class ContactImportsBaseAPI {
    constructor(client, accountId) {
        const contactImports = new ContactImports_1.default(client, accountId);
        this.create = contactImports.create.bind(contactImports);
        this.get = contactImports.get.bind(contactImports);
    }
}
exports.default = ContactImportsBaseAPI;
