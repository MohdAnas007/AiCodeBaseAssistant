
export function chunkFiles(files, chunkSize = 200, overlap = 30) {
    if (chunkSize <= 0 || overlap < 0 || overlap >= chunkSize) {
        throw new Error("Invalid chunkSize or overlap");
    }
    const chunks = [];

    for (const file of files) {
        if (typeof file.content !== "string" || !file.content.trim()) {
            continue;
        }

        const content = file.content;
        let start = 0;
        let chunkIndex = 0;

        while (start < content.length) {
            const end = Math.min(start + chunkSize, content.length);
            const chunkContent = content.slice(start, end);

            // Compute approximate line numbers for metadata
            const startLine = content.slice(0, start).split("\n").length;
            const endLine = content.slice(0, end).split("\n").length;

            chunks.push({
                filePath: file.path,
                chunkIndex,
                startLine,
                endLine,
                content: chunkContent
            });

            if (end === content.length) break;

            start = end - overlap;
            chunkIndex++;
        }
    }

    return chunks;
}