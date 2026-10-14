import express from "express"
import {parseGithubUrl} from "./utils/parseurl.js";
import { getRepoFiles } from "./utils/getRepoFiles.js";
import { openrouter,index } from "./utils/clients.js";
import {config} from "./config/config.js"
const app=express();

app.use(express.json());

app.get("/",(req,res)=>{

    return res.json({
        message:"hello from server"
    })
})

app.post("/api/github-url",async (req,res)=>{
    
    try{
    const url=req.body.url;
    if(!url){
        return res.json({
            message:"please provide url"
        })
    }

    const isRepoExists=await parseGithubUrl(url);
    
    if(!isRepoExists){
        return res.json({
            message:"for this url the repository does not exists"
    })
    }
    



        const result = await getRepoFiles(url);

        console.log("Pipeline working");

        return res.status(200).json({
            message: "Repository files stored successfully",
            result
        });

    }
    catch(error){
        console.error("Pipeline failed:", error.message);

        return res.status(500).json({
            message: "Failed to process repository"
        });
    }

})


app.post("/api/search",async (req,res)=>{

    try{

        const query=req.body.query;

        if(!query || typeof query !== "string" || !query.trim()){

            return res.status(400).json({
                message:"please provide a search query",

            })
        }
        const convertQuerytoEmbedding=await openrouter.embeddings.create({
            model:config.model,
            input:query
        })

        const queryEmbedding=convertQuerytoEmbedding.data[0].embedding;
        const searcResult=await index.query({
            vector:queryEmbedding,
            topK:5,
            includeMetadata:true
        })



        const content=searcResult.matches.map(match => match.metadata?.content).filter(Boolean).join("\n\n---\n\n");
        if(!content){
            return res.status(403).json({
                message:"no relevant info found in the repository",
            })


        }
        const llm=await openrouter.chat.completions.create({
            model:config.chatModel,
            max_tokens:500,
            messages: [
                {
                    role: "system",
                    content: "You are an expert developer assistant. Answer the user's question accurately using only the provided code context."
                },
                {
                    role: "user",
                    content: `Code Context:\n${content}\n\nQuestion: ${query}`
                }
            ]
        })
        const result=llm.choices[0].message.content;

        return res.status(201).json({
            query:query,
            response:result,
        })
    }
    catch(err){
        return res.status(402).json({
            message:"semantic search failed",
            error:err.message
        })
    }
   
})

app.listen(3000,()=>{

    console.log("server started at port 3000");

})