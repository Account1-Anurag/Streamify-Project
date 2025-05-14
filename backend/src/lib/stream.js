import { StreamChat } from 'stream-chat';
import "dotenv/config"

const apiKey = process.env.STREAM_API_KEY
const apiSecret =  process.env.STREAM_API_SECRET

if(!apiKey||!apiSecret){
    console.error("stream api key or secret key is missing");
}

const streamClient = StreamChat.getInstance(apiKey, apiSecret);

export const upsertStreamUser = async (userData)=>{
    try{
        await streamClient.upsertUsers([userData]);
        return userData;
    }catch(error){
        console.error("Error upserting Stream user:", error);
    }
};

// TODO: Implement the function to generate a Stream token

export const generateStreamToken = (userId)=>{
    try {
        // ensure userId is a string
        const userIdStr = userId.toString();
        const token = streamClient.createToken(userIdStr);
        return token;
    } catch (error) {
        console.error("Error generating Stream token:", error);
    }
};