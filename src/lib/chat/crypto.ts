import "server-only"
import crypto from "crypto"

const ENCRYPTION_PREFIX = "enc:v1:"
const IV_LENGTH = 12

function getEncryptionKey(): Buffer {
    const rawKey = process.env.CHAT_ENCRYPTION_KEY
    if (!rawKey) {
        throw new Error("CHAT_ENCRYPTION_KEY is not set")
    }

    const base64Key = Buffer.from(rawKey, "base64")
    if (base64Key.length === 32) {
        return base64Key
    }

    return crypto.createHash("sha256").update(rawKey).digest()
}

export function encryptChatContent(content: string): string {
    if (!content) return content

    const iv = crypto.randomBytes(IV_LENGTH)
    const key = getEncryptionKey()
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv)
    const encrypted = Buffer.concat([cipher.update(content, "utf8"), cipher.final()])
    const tag = cipher.getAuthTag()

    return `${ENCRYPTION_PREFIX}${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString("base64")}`
}

export function decryptChatContent(content: string): string {
    if (!content || !content.startsWith(ENCRYPTION_PREFIX)) return content

    const payload = content.slice(ENCRYPTION_PREFIX.length)
    const [ivB64, tagB64, dataB64] = payload.split(":")

    if (!ivB64 || !tagB64 || !dataB64) {
        throw new Error("Invalid encrypted chat payload")
    }

    const iv = Buffer.from(ivB64, "base64")
    const tag = Buffer.from(tagB64, "base64")
    const encrypted = Buffer.from(dataB64, "base64")
    const key = getEncryptionKey()
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv)
    decipher.setAuthTag(tag)

    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()])
    return decrypted.toString("utf8")
}

export function decryptChatContentSafe(content: string): string {
    if (!content || !content.startsWith(ENCRYPTION_PREFIX)) return content

    try {
        return decryptChatContent(content)
    } catch (error) {
        console.error("Failed to decrypt chat content:", error)
        return "[encrypted message]"
    }
}
