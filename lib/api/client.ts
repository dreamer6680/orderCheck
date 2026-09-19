import { can, type Permission } from '../permissions'
import { useUserStore } from '../store/userStore'
import * as generated from "./generated";
import type {
  AbnormalParams,
  CreateOrderRequest,
  InboundRequest,
  ListInboundRecordsParams,
  ListParams,
  LoginRequest,
} from "./generated";

const requirePermission = (permission: Permission) => {
  const { user, restoreSession } = useUserStore.getState()
  if (!user && typeof window !== 'undefined') restoreSession()
  if (!can(useUserStore.getState().user?.role, permission)) {
    throw new Error('无权执行此操作')
  }
}

const authorized = <T>(permission: Permission, request: () => Promise<T>): Promise<T> => {
  try {
    requirePermission(permission)
    return request()
  } catch (error) {
    return Promise.reject(error)
  }
}

const authOptions = (): RequestInit => {
  if (typeof window === "undefined") return {};

  const token = window.localStorage.getItem("token");
  if (!token) return {};

  const authorization = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
  return { headers: { Authorization: authorization } };
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
  currentUser: () => authorized('dashboard:view', () => unwrap(generated.currentUser(mergeOptions()))),
  listOrders: (params?: ListParams) => authorized('orders:read', () => unwrap(generated.list(params, mergeOptions()))),
  orderDetail: (id: number) => authorized('orders:read', () => unwrap(generated.detail(id, mergeOptions()))),
  createOrder: (body: CreateOrderRequest) => authorized('orders:write', () => unwrap(generated.create(body, mergeOptions()))),
  checkOrder: (id: number) => authorized('orders:write', () => unwrap(generated.check(id, mergeOptions()))),
  recheckOrder: (id: number) => authorized('orders:write', () => unwrap(generated.recheck(id, mergeOptions()))),
  cancelOrder: (id: number) => authorized('orders:write', () => unwrap(generated.cancel(id, mergeOptions()))),
  abnormalOrders: (params?: AbnormalParams) => authorized('orders:read', () => unwrap(generated.abnormal(params, mergeOptions()))),
  listInventory: () => authorized('inventory:read', () => unwrap(generated.listInventory(mergeOptions()))),
  inventoryForProduct: (productId: number) =>
    authorized('inventory:read', () => unwrap(generated.inventoryForProduct(productId, mergeOptions()))),
  listInboundRecords: (params?: ListInboundRecordsParams) =>
    authorized('inventory:write', () => unwrap(generated.listInboundRecords(params, mergeOptions()))),
  recordInbound: (body: InboundRequest) =>
    authorized('inventory:write', () => unwrap(generated.recordInbound(body, mergeOptions()))),
  listProducts: () => authorized('products:read', () => unwrap(generated.listProducts(mergeOptions()))),
  getProduct: (id: number) => authorized('products:read', () => unwrap(generated.getProduct(id, mergeOptions()))),
  createProduct: (body: generated.ProductRequest) =>
    authorized('products:write', () => unwrap(generated.createProduct(body, mergeOptions()))),
  updateProduct: (id: number, body: generated.ProductRequest) =>
    authorized('products:write', () => unwrap(generated.updateProduct(id, body, mergeOptions()))),
  deleteProduct: (id: number) =>
    authorized('products:write', () => unwrap(generated.deleteProduct(id, mergeOptions()))),
}
