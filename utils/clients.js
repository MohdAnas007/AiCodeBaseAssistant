
import {config} from "../config/config.js";

import OpenAI from "openai";
import { Pinecone } from "@pinecone-database/pinecone";

export const openrouter = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: config.openRouterKey
});

export const pinecone = new Pinecone({
    apiKey: config.pineconeKey
});

export const index = pinecone.index("ai-coding-assistant");
