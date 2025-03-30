export const OrderStatusEnum = {
	PENDING: "pending",
	ACTIVE: "active",
	FILLED: "filled",
	PARTIALLY_FILLED: "partially_filled",
	CANCELLED: "cancelled",
	EXPIRED: "expired",
} as const;

export const OrderTypeEnum = {
	MARKET: "market",
	LIMIT: "limit",
	STOP: "stop",
} as const;
