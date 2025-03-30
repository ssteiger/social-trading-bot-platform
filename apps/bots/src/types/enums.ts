export enum OrderStatusEnum {
	PENDING = "pending",
	ACTIVE = "active",
	FILLED = "filled",
	PARTIALLY_FILLED = "partially_filled",
	CANCELLED = "cancelled",
	EXPIRED = "expired",
}

export enum OrderTypeEnum {
	MARKET = "market",
	LIMIT = "limit",
	STOP = "stop",
}
