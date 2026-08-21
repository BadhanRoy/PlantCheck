import { AxiosInstance } from "axios";
import FoldersApi from "./resources/inbound/Folders";
import InboxesApi from "./resources/inbound/Inboxes";
import MessagesApi from "./resources/inbound/Messages";
import ThreadsApi from "./resources/inbound/Threads";
export default class InboundAPI {
    folders: FoldersApi;
    inboxes: InboxesApi;
    messages: MessagesApi;
    threads: ThreadsApi;
    constructor(client: AxiosInstance);
}
//# sourceMappingURL=Inbound.d.ts.map