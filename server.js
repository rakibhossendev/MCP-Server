import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {StdioServerTransport} from "@modelcontextprotocol/sdk/server/stdio.js";
import dotenv from "dotenv";
import google from "googleapis";
import z from "zod";

dotenv.config();

const server = new McpServer({
    name: "my-calender",
    version: "1.0.0"
});

async function getMyCalenderDataBydate (date) {
    const calender = google.calender({
        version: "v3",
        auth: process.env.GOOGLE_CALENDAR_API_KEY,
    })

    const start = new Date(date);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);

    try {
        const response = await calender.events.list({
            calenderId: process.env.GOOGLE_CALENDAR_ID,
            timeMin: start.toISOString(),
            timeMax: end.toISOString(),
            maxResults: 10,
            singleEvents: true,
            orderBy: "startTime",
        });

        const events = response.data.items || [];
        const mettings = events.map((event) => {
            const start = event.start.dateTime || event.start.date;
            return `event: ${event.summary} at ${start}`;
        })

        if(mettings.length > 0) {
            return {
                mettings,
            }
        }else{
            return {
                mettings: ["No meetings found"],
            }
        }

    }catch(error){
        return {
            error: error.message,
        }
    }
}

server.tool("getMyCalenderDataBydate", {
    date: z.string().refine((val) => !isNaN(Date.parse(val)),{
        message: "Invalid date format. Please use YYYY-MM-DD format.",
    }),
},
     async ({date}) => {
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(await getMyCalenderDataBydate(date)),
                }
            ]
        }
     }
)


async function init(){
    const transport = new StdioServerTransport();
    await server.connect(transport);
}

init()