/// <reference types="node" />
/**
 * Hex-encoded HMAC-SHA256 signature length (SHA-256 produces 32 bytes / 64 hex chars).
 */
export declare const SIGNATURE_HEX_LENGTH = 64;
/**
 * Verifies the HMAC-SHA256 signature of a Mailtrap webhook payload.
 *
 * Mailtrap signs every outbound webhook by computing
 * `HMAC-SHA256(signing_secret, raw_request_body)` and sending the lowercase
 * hex digest in the `Mailtrap-Signature` HTTP header. Compute the same digest
 * on your side and compare it in constant time.
 *
 * The comparison is performed with {@link timingSafeEqual} to avoid timing
 * side-channels.
 *
 * The function never throws on inputs that could plausibly arrive over the
 * wire (empty strings, wrong-length signatures, non-hex characters, missing
 * secret) — it simply returns `false`. This makes it safe to call directly
 * from a request handler without wrapping in try/catch.
 *
 * @param payload - The raw request body, exactly as received. Accepts a
 *   UTF-8 `string` or a raw `Buffer`. **Do not** parse and re-serialize the
 *   JSON — re-encoding may reorder keys or alter whitespace and invalidate
 *   the signature. With Express, use
 *   `express.raw({ type: 'application/json' })` (or equivalent) on the
 *   webhook route so the body is preserved verbatim.
 * @param signature - The value of the `Mailtrap-Signature` HTTP header
 *   (lowercase hex string).
 * @param signingSecret - The webhook's `signing_secret`, returned by the
 *   Webhooks API on webhook creation.
 * @returns `true` if the signature is valid for the given payload and
 *   secret, `false` otherwise.
 *
 * @see https://docs.mailtrap.io/email-api-smtp/advanced/webhooks#verifying-the-signature
 */
export default function verifyWebhookSignature(payload: string | Buffer, signature: string, signingSecret: string): boolean;
//# sourceMappingURL=verify-signature.d.ts.map