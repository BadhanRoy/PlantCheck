import { AxiosInstance } from "axios";
import { MessageDetails, MessagesListResponse, MessagesListParams, SendMessageParams, ForwardMessageParams, SendMessageResult } from "../../../../types/api/inbound/messages";
export default class MessagesApi {
    private client;
    private inboxesURL;
    constructor(client: AxiosInstance);
    private messagesURL;
    /**
     * List messages in an inbox (paginated). Pass `last_id` from the previous
     * response to fetch the next page.
     */
    getList(inboxId: number, params?: MessagesListParams): Promise<MessagesListResponse>;
    /**
     * Get a single message with its full body and attachment download URLs.
     */
    get(inboxId: number, messageId: string): Promise<MessageDetails>;
    /**
     * Delete a message by ID.
     */
    delete(inboxId: number, messageId: string): Promise<import("axios").AxiosResponse<any, any, {}>>;
    /**
     * Reply to a message. Sends to the original sender.
     */
    reply(inboxId: number, messageId: string, params: SendMessageParams): Promise<SendMessageResult>;
    /**
     * Reply to a message and copy the original's other recipients.
     */
    replyAll(inboxId: number, messageId: string, params: SendMessageParams): Promise<SendMessageResult>;
    /**
     * Forward a message to new recipients (at least one `to` is required).
     */
    forward(inboxId: number, messageId: string, params: ForwardMessageParams): Promise<SendMessageResult>;
}
//# sourceMappingURL=Messages.d.ts.map