import { describe, expect, it } from "vitest";
import { mentionedProjects } from "@/components/chat/ChatPanel";

const projects = [
  { slug: "genie-a", title: "GenieA" },
  { slug: "star-watch", title: "StarWatch" },
  { slug: "megamind-llm", title: "Offline LLMs at Megamind" },
];

describe("chat follow-ups", () => {
  it("finds case studies by path or by name, in reply order", () => {
    const reply = "At Megamind I fine-tuned LLMs. Later I built GenieA (see /projects/genie-a) and StarWatch.";
    expect(mentionedProjects(reply, projects).map((p) => p.slug)).toEqual(["megamind-llm", "genie-a", "star-watch"]);
  });

  it("ignores partial words", () => {
    expect(mentionedProjects("I watch the stars at night.", projects)).toEqual([]);
  });
});
