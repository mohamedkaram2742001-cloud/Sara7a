import { createClient } from "redis";
import { REDIS_URI } from "../../config/config.service.js";

export const redisClient = createClient({
    url:REDIS_URI
})

export const redicConnection = async()=>{
    try {
        redisClient.connect()
        console.log(`Redis connected Successful`);
    } catch (error) {
        console.log(`Redis connect Fali` ,error);
        
    }
}