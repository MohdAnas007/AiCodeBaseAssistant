import axios from "axios"
import {config} from "../config/config.js";
export async  function parseGithubUrl(url){
    try {
        const parsedUrl = new URL(url);

        if (parsedUrl.hostname !== "github.com") {
            return false;
        }
        

        const [owner ,repo]= parsedUrl.pathname.split("/").filter(Boolean);
        const response = await axios.get(
            `https://api.github.com/repos/${owner}/${repo}`,
            {
            headers: {
                Authorization: `Bearer ${config.gitubtoken}`,
                Accept: "application/vnd.github+json"
            }
             }
        );

        return response.status===200;

    } catch (error) {
         console.log("Status:", error.response?.status);
        console.log("Message:", error.response?.data?.message);
        console.log(
            "Rate limit remaining:",
            error.response?.headers?.["x-ratelimit-remaining"]
        );

        return false;
    }
}

