import type { PlatformSettings } from "@/types";
import type { SettingsService } from "../../api/contracts";
import { mockRequest } from "../../api/delay";
import { validateInput } from "../../api/validate";
import { settingsSchema } from "../../validation/settings";
import { getDb, mutateDb, resetDb } from "../db";

export const settingsService: SettingsService = {
  async get(): Promise<PlatformSettings> {
    return mockRequest("loading settings", () => ({ ...getDb().settings }));
  },

  async update(input: PlatformSettings): Promise<PlatformSettings> {
    return mockRequest("saving settings", () => {
      const values = validateInput(settingsSchema, input);
      return mutateDb((db) => {
        db.settings = { ...values, updatedAt: new Date().toISOString() };
        return { ...db.settings };
      });
    });
  },

  async resetDemoData(): Promise<void> {
    return mockRequest("resetting demo data", () => {
      resetDb();
    });
  },
};
