import { describe, expect, it } from "vitest";
import { getInitials } from "./format";

describe("getInitials", () => {
  it("takes the first letter of a first and last name", () => {
    expect(getInitials("Ada Lovelace")).toBe("AL");
  });
});
