import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  getStoredSaved,
  saveStoredSaved,
  getStoredUserLocation,
  saveStoredUserLocation,
} from "../lib/visits";

describe("Saved Pandals & Location Storage Utility", () => {
  let mockStorage: Record<string, string> = {};

  beforeEach(() => {
    mockStorage = {};
    (global as any).window = {};
    (global as any).localStorage = {
      getItem: (key: string) => mockStorage[key] ?? null,
      setItem: (key: string, value: string) => {
        mockStorage[key] = value;
      },
      removeItem: (key: string) => {
        delete mockStorage[key];
      },
      clear: () => {
        mockStorage = {};
      },
    };
  });

  afterEach(() => {
    delete (global as any).window;
    delete (global as any).localStorage;
  });

  it("returns an empty array when no saved pandals are stored", () => {
    expect(getStoredSaved()).toEqual([]);
  });

  it("stores and retrieves saved pandal IDs", () => {
    const mockIds = ["pandal-1", "pandal-2", "pandal-3"];
    saveStoredSaved(mockIds);
    expect(getStoredSaved()).toEqual(mockIds);
  });

  it("handles corrupted localStorage gracefully", () => {
    (global as any).localStorage.setItem("puja26_saved_pandals_v1", "invalid-json{[[");
    expect(getStoredSaved()).toEqual([]);
  });

  it("allows removing items by saving updated list", () => {
    saveStoredSaved(["pandal-1", "pandal-2"]);
    expect(getStoredSaved()).toHaveLength(2);

    saveStoredSaved(["pandal-1"]);
    expect(getStoredSaved()).toEqual(["pandal-1"]);
  });

  it("stores and retrieves user location across reloads", () => {
    expect(getStoredUserLocation()).toBeNull();
    const loc = { lat: 22.5726, lng: 88.3639 };
    saveStoredUserLocation(loc);
    expect(getStoredUserLocation()).toEqual(loc);
  });

  it("handles invalid or corrupted user location gracefully", () => {
    (global as any).localStorage.setItem("puja26_user_location_v1", "not-json");
    expect(getStoredUserLocation()).toBeNull();

    (global as any).localStorage.setItem("puja26_user_location_v1", JSON.stringify({ lat: "abc" }));
    expect(getStoredUserLocation()).toBeNull();
  });

  it("returns empty array in SSR when window is undefined", () => {
    delete (global as any).window;
    expect(getStoredSaved()).toEqual([]);
    expect(getStoredUserLocation()).toBeNull();
  });
});
