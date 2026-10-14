
import { openrouter, index } from "./clients.js";
import { createHash } from "node:crypto";
import { config } from "../config/config.js";
const BATCH_SIZE = 50;
const MODEL = "liquid/lfm-2.5-embedding-350m:free";
const EXPECTED_DIM = 1024;

export async function storeChunks(chunks, repoUrl) {
    if (!Array.isArray(chunks) || chunks.length === 0) {
        console.log("No chunks to store.");
        return;
    }

    // Remove empty chunks
    const validChunks = chunks.filter(
        chunk =>
            typeof chunk.content === "string" &&
            chunk.content.trim().length > 0
    );

    if (validChunks.length === 0) {
        console.log("No valid chunks found.");
        return;
    }

    console.log(`Total valid chunks: ${validChunks.length}`);

    for (let i = 0; i < validChunks.length; i += BATCH_SIZE) {
        const batch = validChunks.slice(i, i + BATCH_SIZE);

        console.log(
            `Generating embeddings for batch ${Math.floor(i / BATCH_SIZE) + 1}...`
        );

        try {
            // 1. Generate embeddings
            const response = await openrouter.embeddings.create({
                model: config.model,
                input: batch.map(chunk => chunk.content)
            });

            if (!response.data || response.data.length !== batch.length) {
                throw new Error(
                    `Expected ${batch.length} embeddings, received ${response.data?.length ?? 0}`
                );
            }

            // OpenRouter may return embeddings in a different order,
            // so use each response item's index to preserve alignment.
            const embeddings = [...response.data].sort(
                (a, b) => a.index - b.index
            );

            // 2. Build Pinecone records
            const records = batch.map((chunk, j) => {
                const embedding = embeddings[j]?.embedding;

                if (!Array.isArray(embedding)) {
                    throw new Error(`Missing embedding for chunk ${j}`);
                }

                if (embedding.length !== EXPECTED_DIM) {
                    throw new Error(
                        `Dimension mismatch: expected ${EXPECTED_DIM}, received ${embedding.length}`
                    );
                }

                const id = createHash("sha256")
                    .update(
                        `${repoUrl}:${chunk.filePath}:${chunk.chunkIndex}`
                    )
                    .digest("hex");

                return {
                    id,
                    values: embedding,
                    metadata: {
                        repoUrl,
                        filePath: chunk.filePath,
                        chunkIndex: chunk.chunkIndex,
                        startLine: chunk.startLine,
                        endLine: chunk.endLine,
                        content: chunk.content
                    }
                };
            });

            // 3. Validate the records before upserting
            if (!Array.isArray(records) || records.length === 0) {
                console.log("Skipping empty batch.");
                continue;
            }

            console.log(
                `Attempting to upsert ${records.length} records; dimensions: ${records[0].values.length}`
            );

            console.log("First record ID:", records[0].id);

            // Pinecone JavaScript SDK upsert
            await index.upsert({records});

            console.log(
                `Stored ${Math.min(i + batch.length, validChunks.length)} / ${validChunks.length} chunks`
            );
        } catch (error) {
            console.error(
                `Batch starting at chunk ${i} failed:`,
                error.message ?? error
            );

            throw error;
        }
    }

    console.log("All chunks stored successfully!");
}
