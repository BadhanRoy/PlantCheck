import { AxiosInstance } from "axios";
import { CreateWebhookParams, CreateWebhookResponse, DeleteWebhookResponse, GetWebhookResponse, ListWebhooksResponse, UpdateWebhookParams, UpdateWebhookResponse } from "../../../types/api/webhooks";
export default class WebhooksApi {
    private client;
    private webhooksURL;
    constructor(client: AxiosInstance, accountId: number);
    /**
     * Returns all webhooks for the account.
     */
    getList(): Promise<ListWebhooksResponse>;
    /**
     * Create a new webhook for the account. The response includes a
     * `signing_secret` that is used to verify webhook payload signatures —
     * it is only returned on creation, store it securely.
     */
    create(params: CreateWebhookParams): Promise<CreateWebhookResponse>;
    /**
     * Get a single webhook by ID. The `signing_secret` is not returned here —
     * it is only available in the create response.
     */
    get(id: number): Promise<GetWebhookResponse>;
    /**
     * Update an existing webhook. Only `url`, `active`, `payload_format`,
     * `event_types`, and `inbound_inbox_id` can be changed; `webhook_type`,
     * `sending_stream`, and `domain_id` are immutable after creation.
     */
    update(id: number, params: UpdateWebhookParams): Promise<UpdateWebhookResponse>;
    /**
     * Permanently delete a webhook by ID. The deleted webhook is returned in
     * the response.
     */
    delete(id: number): Promise<DeleteWebhookResponse>;
}
//# sourceMappingURL=Webhooks.d.ts.map