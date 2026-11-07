import { describe, expect, it } from "vitest";
import { decideParticipation } from "./capacity";

describe("decideParticipation", () => {
  it("accepts a join while accepted participants are below capacity", () => {
    expect(decideParticipation(5, 3)).toBe("accepted");
  });

  it("waitlists a join once capacity is reached", () => {
    expect(decideParticipation(5, 5)).toBe("waitlisted");
  });

  it("still accepts exactly at the boundary below capacity", () => {
    expect(decideParticipation(5, 4)).toBe("accepted");
  });

  it("accepts every join when no capacity is set", () => {
    expect(decideParticipation(null, 50)).toBe("accepted");
  });
});
