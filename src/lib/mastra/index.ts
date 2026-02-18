import { Mastra } from "@mastra/core";
import { videoAssistant } from "./agent";

export const mastra = new Mastra({
    agents: { videoAssistant },
});
