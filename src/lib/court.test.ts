import { describe, expect, it } from "vitest";
import { generateMessage, normalizePhone, whatsappLink } from "./court";
import { nameToEmail } from "./identity";

describe("court messages", () => {
  it("every tone includes the friend's name and the entered amount", () => {
    for (const tone of ["chacha", "bestie", "service", "warden"] as const) {
      for (let i = 0; i < 10; i++) {
        const msg = generateMessage(tone, "Rohit", 250, () => i / 10);
        expect(msg).toContain("Rohit");
        expect(msg).toContain("₹250");
      }
    }
  });
});

describe("whatsapp", () => {
  it("adds +91 to a 10-digit Indian number", () => {
    expect(normalizePhone("98765 43210")).toBe("919876543210");
    expect(normalizePhone("098765-43210")).toBe("919876543210");
    expect(normalizePhone("123")).toBe("");
  });
  it("builds a wa.me link with the message", () => {
    expect(whatsappLink("9876543210", "hi ₹5")).toBe("https://wa.me/919876543210?text=hi%20%E2%82%B95");
  });
});

describe("name login", () => {
  it("same name in different case/spacing maps to the same account", () => {
    expect(nameToEmail("  Abhinav Yadav ")).toBe(nameToEmail("abhinav yadav"));
  });
});
