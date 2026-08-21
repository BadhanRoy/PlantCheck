"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Stats_1 = __importDefault(require("./resources/Stats"));
class StatsBaseAPI {
    constructor(client, accountId) {
        const stats = new Stats_1.default(client, accountId);
        this.get = stats.get.bind(stats);
        this.byDomain = stats.byDomain.bind(stats);
        this.byCategory = stats.byCategory.bind(stats);
        this.byEmailServiceProvider = stats.byEmailServiceProvider.bind(stats);
        this.byDate = stats.byDate.bind(stats);
    }
}
exports.default = StatsBaseAPI;
