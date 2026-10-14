import { openrouter, pinecone } from "../utils/clients.js";

async function testConnection() {
    try {
        const result = await openrouter.models.list();
        console.log("OpenRouter connected!", result.data.length, "models");
    } catch (error) {
        console.error("OpenRouter failed:", error.message);
    }

    try {
        const result = await pinecone.listIndexes();
        console.log("Pinecone connected!", result.indexes);
    } catch (error) {
        console.error("Pinecone failed:", error.message);
    }
}

testConnection();