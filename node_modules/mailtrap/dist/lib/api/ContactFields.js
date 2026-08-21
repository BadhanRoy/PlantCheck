"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ContactFields_1 = __importDefault(require("./resources/ContactFields"));
class ContactFieldsBaseAPI {
    constructor(client, accountId) {
        const contactFields = new ContactFields_1.default(client, accountId);
        this.create = contactFields.create.bind(contactFields);
        this.get = contactFields.get.bind(contactFields);
        this.getList = contactFields.getList.bind(contactFields);
        this.update = contactFields.update.bind(contactFields);
        this.delete = contactFields.delete.bind(contactFields);
    }
}
exports.default = ContactFieldsBaseAPI;
