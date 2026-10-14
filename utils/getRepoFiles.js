import axios from "axios"
import { chunkFiles } from "./chunkFile.js";
import { storeChunks } from "./storeChunks.js";
export async function getRepoFiles(url){
    try{
        const parsedUrl=new URL(url);
        const [owner,repo]=parsedUrl.pathname.split("/").filter(Boolean);
        
        const repoResponse = await axios.get(
            `https://api.github.com/repos/${owner}/${repo}`
        );
        // blob means a file 
        const branch = repoResponse.data.default_branch;

        const treeResponse=await axios.get( `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`);

        const files=treeResponse.data.tree.filter(
            file=>file.type==="blob"
        )

        const contentofFile=await Promise.all(
            files.map(async (file)=>{

                try{
                    const response=await axios.get(
                        `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${file.path}`,
                        {responseType:"text"}
                    );
                    return {
                        path:file.path,
                        content:response.data
                    }
                }
                catch(error){
                    return {
                        path:file.path,
                        content:null,
                        error:"Could not fetch the file"
                    }
                }
            })

            
        )

        const chunks= chunkFiles(contentofFile,400,50);
        await storeChunks(chunks,url);

    }
    catch(err){
        console.log(err.message);


    }
}
    
