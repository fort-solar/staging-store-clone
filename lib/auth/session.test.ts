import { webcrypto } from "crypto";
import { TextDecoder, TextEncoder } from "util";

describe("store session helpers", () => {
  beforeEach(() => {
    process.env.FORTSOLAR_STORE_SESSION_SECRET = "store-ci-session-secret-1234567890";
    Object.defineProperty(globalThis, "crypto", {
      value: webcrypto,
      configurable: true,
    });
    Object.assign(globalThis, { TextEncoder, TextDecoder });
    jest.resetModules();
  });

  it("serializes and verifies signed session snapshots", async () => {
    const sessionModule = await import("@/lib/auth/session");

    const snapshot = sessionModule.createSessionSnapshot(
      {
        session: {
          userId: "user-1",
          email: "customer@example.com",
          fullName: "Jane Customer",
          role: "customer",
          signedInAt: "2026-05-26T00:00:00.000Z",
        },
        user: {
          id: "user-1",
          email: "customer@example.com",
          name: "Jane",
          fullName: "Jane Customer",
          phone: null,
          address: null,
          role: "customer",
          adminRole: null,
          status: "active",
          avatar_url: null,
          emailVerified: true,
          createdAt: "2026-05-26T00:00:00.000Z",
        },
      },
      "customer",
      "2026-05-27T00:00:00.000Z",
    );

    const signed = await sessionModule.serializeSessionSnapshot(snapshot);
    const decoded = await sessionModule.deserializeSessionSnapshot(signed);

    expect(decoded).toEqual(snapshot);
  });

  it("reuses the existing session when a profile update only returns user data", async () => {
    const sessionModule = await import("@/lib/auth/session");

    const snapshot = sessionModule.createSessionSnapshotFromUpdatedUser(
      {
        success: true,
        user: {
          id: "user-1",
          email: "customer@example.com",
          name: "John",
          fullName: "John Cletus",
          phone: "07068619556",
          address: "54 Utang Street Uyo",
          role: "customer",
          adminRole: null,
          status: "active",
          avatar_url: "https://example.com/avatar.png",
          emailVerified: true,
          createdAt: "2026-05-26T00:00:00.000Z",
        },
      },
      {
        userId: "user-1",
        email: "customer@example.com",
        fullName: "Jane Customer",
        role: "customer",
        signedInAt: "2026-05-26T00:00:00.000Z",
      },
      "2026-05-27T00:00:00.000Z",
      "customer",
    );

    expect(snapshot.session).toEqual({
      userId: "user-1",
      email: "customer@example.com",
      fullName: "John Cletus",
      role: "customer",
      signedInAt: "2026-05-26T00:00:00.000Z",
      adminRole: null,
    });
    expect(snapshot.user.fullName).toBe("John Cletus");
    expect(snapshot.user.address).toBe("54 Utang Street Uyo");
    expect(snapshot.expiresAt).toBe("2026-05-27T00:00:00.000Z");
  });
});
