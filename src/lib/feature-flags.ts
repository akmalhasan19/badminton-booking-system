const parseBooleanEnv = (value: string | undefined, defaultValue = false): boolean => {
    if (!value) return defaultValue
    return value.toLowerCase() === "true"
}

export const ENABLE_MATCH_SHOP = parseBooleanEnv(
    process.env.NEXT_PUBLIC_ENABLE_MATCH_SHOP,
    false
)
