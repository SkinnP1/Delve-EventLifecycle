import { AppService } from './app.service';
export declare class AppController {
    private readonly appService;
    constructor(appService: AppService);
    getHello(): string;
    getHealth(): object;
    sendMessage(topic: string, body: {
        message: any;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
}
