import "dotenv/config"

if(!process.env.PINECONE_API_KEY){
    throw "Pinecone api not found in .env file "

}

if(!process.env.OPENROUTER_API_KEY){
    throw "OpenRouter api not found in .env file "
}
if(!process.env.MODEL)
{
    throw "Model name not found in env "
}
if(!process.env.GITHUB_TOKEN){
    throw "github access token not found in the env "
}
if(!process.env.CHAT_MODEL){
    throw "chat model not found in env "
}

export const  config={
    pineconeKey:process.env.PINECONE_API_KEY,
    openRouterKey:process.env.OPENROUTER_API_KEY,
    model:process.env.MODEL,
    gitubtoken:process.env.GITHUB_TOKEN,
    chatModel:process.env.CHAT_MODEL,
}