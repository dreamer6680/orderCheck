import * as generated from "./generated";
import type {
  AbnormalParams,
  CreateOrderRequest,
  InboundRequest,
  ListInboundRecordsParams,
  ListParams,
  LoginRequest,
} from "./generated";

const authOptions = (): RequestInit => {
  if (typeof window === "undefined") return {};

  const token = window.localStorage.getItem("token");
  return token
    ? { headers: { Authorization: `Bearer ${token}` } }
    : {};
};

const mergeOptions = (options?: RequestInit): RequestInit => {
  const auth = authOptions();
  return {
    ...auth,
    ...options,
    headers: {
      ...auth.headers,
      ...options?.headers,
    },
  };
};

const unwrap = async <T>(promise: Promise<{ data: T; status: number }>): Promise<T> => {
  const response = await promise;

  if (response.status === 401 && typeof window !== "undefined") {
    window.localStorage.removeItem("token");
    window.localStorage.removeItem("user");
    if (window.location.pathname !== "/login") {
      window.location.assign("/login");
    }
  }

  if (response.status < 200 || response.status >= 300) {
    const message =
      typeof response.data === "object" &&
      response.data !== null &&
      "message" in response.data
        ? String((response.data as { message?: unknown }).message)
        : `请求失败（HTTP ${response.status}）`;
    throw new Error(message);
  }

  return response.data;
};

export const api = {
  login: (body: LoginRequest) => unwrap(generated.login(body)),
  currentUser: () => unwrap(generated.currentUser(mergeOptions())),
  listOrders: (params?: ListParams) => unwrap(generated.list(params, mergeOptions())),
  orderDetail: (id: number) => unwrap(generated.detail(id, mergeOptions())),
  createOrder: (body: CreateOrderRequest) => unwrap(generated.create(body, mergeOptions())),
  checkOrder: (id: number) => unwrap(generated.check(id, mergeOptions())),
  recheckOrder: (id: number) => unwrap(generated.recheck(id, mergeOptions())),
  cancelOrder: (id: number) => unwrap(generated.cancel(id, mergeOptions())),
  abnormalOrders: (params?: AbnormalParams) => unwrap(generated.abnormal(params, mergeOptions())),
  listInventory: () => unwrap(generated.listInventory(mergeOptions())),
  inventoryForProduct: (productId: number) =>
    unwrap(generated.inventoryForProduct(productId, mergeOptions())),
  listInboundRecords: (params?: ListInboundRecordsParams) =>
    unwrap(generated.listInboundRecords(params, mergeOptions())),
  recordInbound: (body: InboundRequest) =>
    unwrap(generated.recordInbound(body, mergeOptions())),
  listProducts: () => unwrap(generated.listProducts(mergeOptions())),
};
